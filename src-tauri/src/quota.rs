use reqwest::header::{HeaderMap, HeaderValue};
use serde_json::Value;

const USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Build a client that mimics the claude.ai web app closely enough to get past
// the WAF / bot checks on the usage endpoint. Plain reqwest defaults get a 403
// there even with a valid cookie; the browser-like headers below are required.
fn build_client() -> Result<reqwest::Client, String> {
    let mut headers = HeaderMap::new();
    headers.insert(reqwest::header::USER_AGENT, HeaderValue::from_static(USER_AGENT));
    headers.insert(reqwest::header::ACCEPT, HeaderValue::from_static("*/*"));
    headers.insert(
        reqwest::header::ACCEPT_LANGUAGE,
        HeaderValue::from_static("en-US,en;q=0.9"),
    );
    headers.insert(reqwest::header::REFERER, HeaderValue::from_static("https://claude.ai/"));
    headers.insert(reqwest::header::ORIGIN, HeaderValue::from_static("https://claude.ai"));
    headers.insert("anthropic-client-platform", HeaderValue::from_static("web_claude_ai"));
    headers.insert("Sec-Fetch-Dest", HeaderValue::from_static("empty"));
    headers.insert("Sec-Fetch-Mode", HeaderValue::from_static("cors"));
    headers.insert("Sec-Fetch-Site", HeaderValue::from_static("same-origin"));

    reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| format!("Connection failed: {e}"))
}

// Runs entirely in the Rust process to bypass browser CORS/cookie restrictions.
// The raw usage payload is returned untyped so upstream field-name changes
// (snake_case vs camelCase) are absorbed by the frontend, not here.
pub async fn fetch_live_limits(session_key: &str) -> Result<Value, String> {
    if session_key.is_empty() {
        return Err("Session key is empty.".into());
    }

    let client = build_client()?;
    let cookie = format!("sessionKey={session_key}");

    // 1. Resolve the first organization's UUID.
    let orgs_resp = client
        .get("https://claude.ai/api/organizations")
        .header("Cookie", &cookie)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {e}"))?;

    if !orgs_resp.status().is_success() {
        let code = orgs_resp.status().as_u16();
        if code == 401 || code == 403 {
            return Err("Unauthorized. The sessionKey might be invalid or expired.".into());
        }
        return Err(format!("Server returned status {code}"));
    }

    let orgs: Value = orgs_resp
        .json()
        .await
        .map_err(|e| format!("Connection failed: {e}"))?;

    let org_ids: Vec<&str> = orgs
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|org| org.get("uuid").and_then(|u| u.as_str()))
                .collect()
        })
        .unwrap_or_default();

    if org_ids.is_empty() {
        return Err("No organizations found on this account.".into());
    }

    // 2. Fetch the rate-limit / usage payload. Some accounts have multiple
    //    organizations where only one can be queried for usage, so try each in
    //    turn and return the first that succeeds.
    let mut last_status: Option<u16> = None;
    for org_id in &org_ids {
        let usage_url = format!("https://claude.ai/api/organizations/{org_id}/usage");
        let limits_resp = client
            .get(&usage_url)
            .header("Cookie", &cookie)
            .send()
            .await
            .map_err(|e| format!("Connection failed: {e}"))?;

        if limits_resp.status().is_success() {
            return limits_resp
                .json()
                .await
                .map_err(|e| format!("Connection failed: {e}"));
        }
        last_status = Some(limits_resp.status().as_u16());
    }

    Err(format!(
        "Failed to fetch limits. Status: {}",
        last_status.unwrap_or(0)
    ))
}
