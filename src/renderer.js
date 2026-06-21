// State variables for Minimal Multi-Account Quota Widget
let appState = {
  activeView: 'dashboard', // 'dashboard' or 'settings'
  accounts: [],            // List of { id, label, sessionKey, quotaData: null, lastFetchTime: 0, status: 'offline' }
  globalStatus: 'offline'  // 'offline', 'syncing', 'online', 'warning', 'error'
};

let autoRefreshIntervalId = null;

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupFormHandlers();
  loadAllData();
  setupIPCListeners();
});

// Setup automatic background refresh every 15 minutes
function startAutoRefresh() {
  if (autoRefreshIntervalId) {
    clearInterval(autoRefreshIntervalId);
  }
  autoRefreshIntervalId = setInterval(() => {
    refreshAllAccounts();
  }, 15 * 60 * 1000); // 15 minutes
}

// Setup real-time CLI and window visibility listeners
function setupIPCListeners() {
  if (window.claudeAPI) {
    if (typeof window.claudeAPI.onDataChanged === 'function') {
      window.claudeAPI.onDataChanged(() => {
        console.log('Local Claude Code data changed. Triggering sync...');
        refreshAllAccounts();
      });
    }
    if (typeof window.claudeAPI.onWindowShown === 'function') {
      window.claudeAPI.onWindowShown(() => {
        console.log('Widget window shown. Triggering foreground sync...');
        refreshAllAccounts();
      });
    }
  }
}

// Setup Navigation & Actions
function setupNavigation() {
  const toggleBtn = document.getElementById('btn-toggle-settings');
  const dashEmptyBtn = document.getElementById('btn-go-to-settings');
  const refreshAllBtn = document.getElementById('btn-refresh-all');
  
  const showView = (view) => {
    appState.activeView = view;
    if (view === 'settings') {
      toggleBtn.classList.add('active');
      document.getElementById('dashboard-view').classList.add('hidden');
      document.getElementById('settings-view').classList.remove('hidden');
      renderSettingsAccountsList();
    } else {
      toggleBtn.classList.remove('active');
      document.getElementById('settings-view').classList.add('hidden');
      document.getElementById('dashboard-view').classList.remove('hidden');
      renderAccountsGrid();
    }
  };

  toggleBtn.addEventListener('click', () => {
    if (appState.activeView === 'dashboard') {
      showView('settings');
    } else {
      showView('dashboard');
    }
  });

  if (dashEmptyBtn) {
    dashEmptyBtn.addEventListener('click', () => {
      showView('settings');
    });
  }

  // Refresh All button
  if (refreshAllBtn) {
    refreshAllBtn.addEventListener('click', () => {
      refreshAllAccounts();
    });
  }
}

// Load accounts list from tracker-settings.json on startup
async function loadAllData() {
  try {
    const trackerSettings = await window.claudeAPI.getTrackerSettings();
    appState.accounts = trackerSettings.accounts || [];
    
    if (!Array.isArray(appState.accounts)) {
      appState.accounts = [];
    }

    renderAccountsGrid();
    renderSettingsAccountsList();

    // Trigger parallel quota fetch if accounts exist
    if (appState.accounts.length > 0) {
      refreshAllAccounts();
    } else {
      updateGlobalStatus();
    }
  } catch (err) {
    console.error('Error loading account settings:', err);
    updateGlobalStatus();
  }
}

// Refresh all accounts in parallel
async function refreshAllAccounts() {
  if (appState.accounts.length === 0) return;

  // Restart auto-refresh interval timer to avoid double updates
  startAutoRefresh();

  appState.globalStatus = 'syncing';
  updateGlobalStatus();

  // Set individual status to syncing
  appState.accounts.forEach(acc => {
    acc.status = 'syncing';
    updateAccountCardUI(acc);
  });

  const fetchPromises = appState.accounts.map(acc => fetchAccountQuota(acc));
  await Promise.all(fetchPromises);

  // Update global status based on aggregate results
  let allSuccess = true;
  let anySuccess = false;
  
  appState.accounts.forEach(acc => {
    if (acc.status === 'online') {
      anySuccess = true;
    } else {
      allSuccess = false;
    }
  });

  if (allSuccess) {
    appState.globalStatus = 'online';
  } else if (anySuccess) {
    appState.globalStatus = 'warning';
  } else {
    appState.globalStatus = 'error';
  }

  updateGlobalStatus();
  renderAccountsGrid();
}

// Fetch live limits for a single account
async function fetchAccountQuota(account) {
  try {
    const result = await window.claudeAPI.fetchLiveLimits(account.sessionKey);
    if (result && result.success && result.data) {
      account.quotaData = result.data;
      account.lastFetchTime = Date.now();
      account.status = 'online';
    } else {
      account.quotaData = null;
      account.status = 'error';
      account.errorMsg = result ? result.error : 'Connection error';
    }
  } catch (e) {
    account.quotaData = null;
    account.status = 'error';
    account.errorMsg = e.message;
  }
  updateAccountCardUI(account);
}

// Setup Account Form submission & Key management
function setupFormHandlers() {
  const form = document.getElementById('add-account-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const labelInput = document.getElementById('account-label');
      const keyInput = document.getElementById('account-session-key');
      const label = labelInput.value.trim();
      const keyVal = keyInput.value.trim();
      
      if (!label || !keyVal) return;

      const newAccount = {
        id: 'acc_' + Math.random().toString(36).substr(2, 9),
        label: label,
        sessionKey: keyVal,
        quotaData: null,
        lastFetchTime: 0,
        status: 'syncing'
      };

      appState.accounts.push(newAccount);
      
      // Save list to disk
      const success = await saveAccountsToDisk();
      if (success) {
        // Clear form
        form.reset();
        
        // Return to dashboard
        document.getElementById('btn-toggle-settings').click();
        
        // Fetch new account limits
        await fetchAccountQuota(newAccount);
        renderAccountsGrid();
        updateGlobalStatus();
      } else {
        alert('Failed to save account.');
      }
    });
  }
}

// Save accounts array to local profile tracker-settings.json
async function saveAccountsToDisk() {
  // Strip transient status values before writing config file
  const accountsToSave = appState.accounts.map(acc => ({
    id: acc.id,
    label: acc.label,
    sessionKey: acc.sessionKey
  }));
  
  const result = await window.claudeAPI.saveTrackerSettings({ accounts: accountsToSave });
  return result && result.success;
}

// Render quota cards on dashboard
function renderAccountsGrid() {
  const container = document.getElementById('accounts-container');
  const emptyState = document.getElementById('dashboard-empty-state');
  
  if (!container || !emptyState) return;

  if (appState.accounts.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = '';

  appState.accounts.forEach(acc => {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.id = `card-${acc.id}`;
    
    // Card Header
    const header = document.createElement('div');
    header.className = 'account-card-header';
    
    const info = document.createElement('div');
    info.className = 'account-info';
    
    const dot = document.createElement('span');
    dot.className = `pulse-dot ${acc.status === 'error' ? 'error' : acc.status === 'syncing' ? 'warning' : 'online'}`;
    
    const name = document.createElement('span');
    name.className = 'account-name';
    name.textContent = acc.label;

    info.appendChild(dot);
    info.appendChild(name);
    
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn-icon';
    refreshBtn.title = 'Refresh Account';
    refreshBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`;
    refreshBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      acc.status = 'syncing';
      updateAccountCardUI(acc);
      await fetchAccountQuota(acc);
      renderAccountsGrid();
      updateGlobalStatus();
    });

    header.appendChild(info);
    header.appendChild(refreshBtn);
    card.appendChild(header);

    // Card Body
    const body = document.createElement('div');
    body.className = 'account-card-body';

    if (acc.status === 'error') {
      body.innerHTML = `
        <div style="color: var(--error-color); font-size: 12px; text-align: center; padding: 10px 0; line-height: 1.4;">
          <strong>Sync Failed:</strong><br>${acc.errorMsg || 'Unauthorized / Invalid Key'}
        </div>
      `;
    } else if (acc.status === 'syncing' && !acc.quotaData) {
      body.innerHTML = `
        <div style="color: var(--text-dimmed); font-size: 12px; text-align: center; padding: 10px 0;">
          Syncing quotas...
        </div>
      `;
    } else {
      const q = acc.quotaData || {};
      
      let sessionPct = 0;
      let weeklyPct = 0;
      let sessionResetsAt = null;
      let weeklyResetsAt = null;

      if (q.five_hour || q.fiveHour) {
        const fh = q.five_hour || q.fiveHour;
        sessionPct = fh.utilization !== undefined ? Math.round(fh.utilization) : 0;
        sessionResetsAt = fh.resets_at || fh.resetsAt;
      }
      if (q.seven_day || q.sevenDay) {
        const sd = q.seven_day || q.sevenDay;
        weeklyPct = sd.utilization !== undefined ? Math.round(sd.utilization) : 0;
        weeklyResetsAt = sd.resets_at || sd.resetsAt;
      }

      const sessionBarClass = sessionPct >= 95 ? 'danger' : sessionPct >= 80 ? 'warning' : '';
      const weeklyBarClass = weeklyPct >= 95 ? 'danger' : weeklyPct >= 80 ? 'warning' : 'weekly';

      body.innerHTML = `
        <!-- Session Limits -->
        <div class="quota-item">
          <div class="quota-header-row">
            <span class="quota-title">Current Session (5h Window)</span>
            <span class="quota-desc">${sessionPct}% used</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill ${sessionBarClass}" style="width: ${sessionPct}%;"></div>
          </div>
          <div class="quota-footer-row">${sessionResetsAt ? 'Resets ' + formatTimeUntil(sessionResetsAt) : 'Resets periodically'}</div>
        </div>

        <!-- Weekly Limits -->
        <div class="quota-item">
          <div class="quota-header-row">
            <span class="quota-title">Weekly Account Limits</span>
            <span class="quota-desc">${weeklyPct}% used</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill ${weeklyBarClass}" style="width: ${weeklyPct}%;"></div>
          </div>
          <div class="quota-footer-row">${weeklyResetsAt ? 'Resets ' + formatTimeUntil(weeklyResetsAt) : 'Resets weekly'}</div>
        </div>
      `;
    }

    card.appendChild(body);
    container.appendChild(card);
  });
}

// Render accounts in settings list
function renderSettingsAccountsList() {
  const container = document.getElementById('accounts-settings-list');
  if (!container) return;

  if (appState.accounts.length === 0) {
    container.innerHTML = `<div style="color: var(--text-dimmed); font-size: 12px; text-align: center; padding: 15px 0;">No accounts added yet.</div>`;
    return;
  }

  container.innerHTML = '';
  appState.accounts.forEach(acc => {
    const row = document.createElement('div');
    row.className = 'account-settings-row';
    
    const info = document.createElement('div');
    info.className = 'account-settings-info';
    
    const name = document.createElement('span');
    name.className = 'account-settings-label';
    name.textContent = acc.label;
    
    const mask = document.createElement('span');
    mask.className = 'account-settings-mask';
    const key = acc.sessionKey || '';
    const maskedKey = key.length > 20 
      ? key.substring(0, 12) + '...' + key.substring(key.length - 6)
      : '••••••••••••';
    mask.textContent = maskedKey;
    
    info.appendChild(name);
    info.appendChild(mask);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-action';
    deleteBtn.textContent = 'Remove';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Remove account "${acc.label}"?`)) {
        appState.accounts = appState.accounts.filter(a => a.id !== acc.id);
        const success = await saveAccountsToDisk();
        if (success) {
          renderSettingsAccountsList();
          renderAccountsGrid();
          updateGlobalStatus();
        } else {
          alert('Failed to remove account.');
        }
      }
    });

    row.appendChild(info);
    row.appendChild(deleteBtn);
    container.appendChild(row);
  });
}

// Update card status dot instantly
function updateAccountCardUI(acc) {
  const card = document.getElementById(`card-${acc.id}`);
  if (!card) return;
  const dot = card.querySelector('.pulse-dot');
  if (dot) {
    dot.className = `pulse-dot ${acc.status === 'error' ? 'error' : acc.status === 'syncing' ? 'warning' : 'online'}`;
  }
}

// Update global status bar & sync indicator
function updateGlobalStatus() {
  const dot = document.getElementById('global-sync-dot');
  const text = document.getElementById('global-sync-text');
  const time = document.getElementById('last-sync-time');

  if (!dot || !text) return;

  if (appState.accounts.length === 0) {
    dot.className = 'pulse-dot error';
    text.textContent = 'No Accounts Connected';
    if (time) time.textContent = 'Last Sync: --';
    return;
  }

  dot.className = `pulse-dot ${
    appState.globalStatus === 'syncing' ? 'warning' :
    appState.globalStatus === 'online' ? 'online' :
    appState.globalStatus === 'warning' ? 'warning' : 'error'
  }`;

  text.textContent = 
    appState.globalStatus === 'syncing' ? 'Syncing...' :
    appState.globalStatus === 'online' ? 'Synced' :
    appState.globalStatus === 'warning' ? 'Sync issues' : 'Offline / Error';

  const latestFetch = Math.max(...appState.accounts.map(a => a.lastFetchTime || 0));
  if (latestFetch > 0 && time) {
    time.textContent = `Last Sync: ${new Date(latestFetch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
}

// Format reset target ISO date string to remaining time countdown
function formatTimeUntil(isoString) {
  if (!isoString) return '--';
  try {
    const targetDate = new Date(isoString);
    const diffMs = targetDate - new Date();
    if (diffMs <= 0) return 'any moment';

    const totalMin = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;

    if (hrs >= 24) {
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
      const timeStr = targetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dayName} ${timeStr}`;
    }
    if (hrs > 0) {
      return `in ${hrs}h ${mins}m`;
    }
    return `in ${mins}m`;
  } catch (e) {
    return 'soon';
  }
}
