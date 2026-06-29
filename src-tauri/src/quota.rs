use serde_json::Value;

const USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Runs entirely in the Rust process to bypass browser CORS/cookie restrictions.
// The raw usage payload is returned untyped so upstream field-name changes
// (snake_case vs camelCase) are absorbed by the frontend, not here.
pub async fn fetch_live_limits(session_key: &str) -> Result<Value, String> {
    if session_key.is_empty() {
        return Err("Session key is empty.".into());
    }

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Connection failed: {e}"))?;
    let cookie = format!("sessionKey={session_key}");

    // 1. Resolve the first organization's UUID.
    let orgs_resp = client
        .get("https://claude.ai/api/organizations")
        .header("Cookie", &cookie)
        .header("User-Agent", USER_AGENT)
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

    let org_id = orgs
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|org| org.get("uuid"))
        .and_then(|uuid| uuid.as_str())
        .ok_or("No organizations found on this account.")?;

    // 2. Fetch the rate-limit / usage payload.
    let usage_url = format!("https://claude.ai/api/organizations/{org_id}/usage");
    let limits_resp = client
        .get(&usage_url)
        .header("Cookie", &cookie)
        .header("User-Agent", USER_AGENT)
        .send()
        .await
        .map_err(|e| format!("Connection failed: {e}"))?;

    if !limits_resp.status().is_success() {
        return Err(format!(
            "Failed to fetch limits. Status: {}",
            limits_resp.status().as_u16()
        ));
    }

    limits_resp
        .json()
        .await
        .map_err(|e| format!("Connection failed: {e}"))
}
