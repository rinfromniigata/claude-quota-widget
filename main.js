const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let tray = null;
app.isQuitting = false;
let currentClaudeDir = path.join(os.homedir(), '.claude');
let activeWatchers = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 680,
    minWidth: 420,
    minHeight: 500,
    titleBarStyle: 'hiddenInset', // Hidden title bar with Traffic Lights on macOS
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#16161a',
    show: false, // Prevents flash of white/unpainted window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Dynamic Dock icon visibility on macOS
  mainWindow.on('show', () => {
    if (process.platform === 'darwin') {
      try { app.dock.show(); } catch (e) {}
    }
    try {
      mainWindow.webContents.send('claude:window-shown');
    } catch (err) {
      console.error('Error sending window-shown event:', err);
    }
  });

  mainWindow.on('hide', () => {
    if (process.platform === 'darwin') {
      try { app.dock.hide(); } catch (e) {}
    }
  });

  // Hide window instead of destroying on close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-iconTemplate.png');
  if (fs.existsSync(iconPath)) {
    try {
      const trayImage = nativeImage.createFromPath(iconPath);
      // setTemplateImage enables automatic black/white conversion based on dark/light status bars
      trayImage.setTemplateImage(true);

      tray = new Tray(trayImage);
      tray.setToolTip('Claude Quota Widget');

      tray.on('click', () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      });

      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Widget', click: () => { mainWindow.show(); mainWindow.focus(); } },
        { label: 'Hide Widget', click: () => { mainWindow.hide(); } },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
      ]);
      tray.setContextMenu(contextMenu);
    } catch (err) {
      console.error('Failed to create tray icon:', err);
    }
  } else {
    console.warn('Tray icon source not found at:', iconPath);
  }
}

function setupFileWatchers() {
  // Dispose of any active watchers first
  activeWatchers.forEach(watcher => {
    try {
      watcher.close();
    } catch (e) {
      console.error('Error closing watcher:', e);
    }
  });
  activeWatchers = [];

  const historyPath = path.join(currentClaudeDir, 'history.jsonl');
  const statsPath = path.join(currentClaudeDir, 'stats-cache.json');

  let watchTimeout;
  const triggerUpdate = (type) => {
    if (watchTimeout) clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('claude:data-changed', { type });
      }
    }, 500); // Debounce updates
  };

  try {
    if (fs.existsSync(historyPath)) {
      const historyWatcher = fs.watch(historyPath, (event) => {
        if (event === 'change') triggerUpdate('history');
      });
      activeWatchers.push(historyWatcher);
    }

    if (fs.existsSync(statsPath)) {
      const statsWatcher = fs.watch(statsPath, (event) => {
        if (event === 'change') triggerUpdate('stats');
      });
      activeWatchers.push(statsWatcher);
    }
  } catch (err) {
    console.error('Error setting up file watchers:', err);
  }
}

// Helpers for reading files
function readJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading JSON file at ${filePath}:`, err);
  }
  return null;
}

function readJSONLFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error('Error parsing JSONL line:', e);
            return null;
          }
        })
        .filter(Boolean);
    }
  } catch (err) {
    console.error(`Error reading JSONL file at ${filePath}:`, err);
  }
  return [];
}

// IPC Handlers
ipcMain.handle('claude:getProfiles', async () => {
  const home = os.homedir();
  const profiles = [];
  
  try {
    const files = fs.readdirSync(home, { withFileTypes: true });
    
    for (const f of files) {
      if (f.isDirectory() && f.name.startsWith('.claude')) {
        const fullPath = path.join(home, f.name);
        
        // Match folders that have essential Claude CLI files
        const hasHistory = fs.existsSync(path.join(fullPath, 'history.jsonl'));
        const hasStats = fs.existsSync(path.join(fullPath, 'stats-cache.json'));
        const hasSettings = fs.existsSync(path.join(fullPath, 'settings.json'));
        
        if (hasHistory || hasStats || hasSettings) {
          let label = 'Default';
          if (f.name !== '.claude') {
            // E.g., .claude-personal -> Personal
            const rawLabel = f.name.replace('.claude-', '');
            label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
          }
          
          profiles.push({
            name: label,
            dirName: f.name,
            path: fullPath
          });
        }
      }
    }
  } catch (err) {
    console.error('Error listing profiles:', err);
  }
  
  // Ensure we always have at least default profile if scan failed or is empty
  if (profiles.length === 0) {
    profiles.push({
      name: 'Default',
      dirName: '.claude',
      path: path.join(home, '.claude')
    });
  }
  
  return profiles;
});

ipcMain.handle('claude:switchProfile', async (event, dirName) => {
  const targetPath = path.join(os.homedir(), dirName);
  if (fs.existsSync(targetPath)) {
    currentClaudeDir = targetPath;
    setupFileWatchers(); // Re-assign watchers to files in the new directory
    return { success: true, path: targetPath };
  }
  return { success: false, error: `Directory ${dirName} not found` };
});

ipcMain.handle('claude:getStats', async () => {
  const statsPath = path.join(currentClaudeDir, 'stats-cache.json');
  return readJSONFile(statsPath);
});

ipcMain.handle('claude:getSettings', async () => {
  const settingsPath = path.join(currentClaudeDir, 'settings.json');
  return readJSONFile(settingsPath);
});

ipcMain.handle('claude:saveSettings', async (event, settings) => {
  const settingsPath = path.join(currentClaudeDir, 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Error writing settings:', err);
    return { success: false, error: err.message };
  }
});

// Tracker Settings (profile-specific config)
ipcMain.handle('claude:getTrackerSettings', async () => {
  const trackerSettingsPath = path.join(currentClaudeDir, 'tracker-settings.json');
  return readJSONFile(trackerSettingsPath) || {};
});

ipcMain.handle('claude:saveTrackerSettings', async (event, settings) => {
  const trackerSettingsPath = path.join(currentClaudeDir, 'tracker-settings.json');
  try {
    fs.writeFileSync(trackerSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Error writing tracker settings:', err);
    return { success: false, error: err.message };
  }
});

// Fetch Real-time Quota limits from Claude Server via private Web APIs
ipcMain.handle('claude:fetchLiveLimits', async (event, sessionKey) => {
  if (!sessionKey) {
    return { success: false, error: 'Session key is empty.' };
  }

  try {
    // 1. Fetch organization IDs
    const orgsResponse = await fetch('https://claude.ai/api/organizations', {
      headers: {
        'Cookie': `sessionKey=${sessionKey}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!orgsResponse.ok) {
      if (orgsResponse.status === 403 || orgsResponse.status === 401) {
        return { success: false, error: 'Unauthorized. The sessionKey might be invalid or expired.' };
      }
      return { success: false, error: `Server returned status ${orgsResponse.status}` };
    }

    const orgs = await orgsResponse.json();
    if (!Array.isArray(orgs) || orgs.length === 0) {
      return { success: false, error: 'No organizations found on this account.' };
    }

    const orgId = orgs[0].uuid;

    // 2. Fetch Chat limitations / Rate limits
    const limitsResponse = await fetch(`https://claude.ai/api/organizations/${orgId}/usage`, {
      headers: {
        'Cookie': `sessionKey=${sessionKey}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!limitsResponse.ok) {
      return { success: false, error: `Failed to fetch limits. Status: ${limitsResponse.status}` };
    }

    const limits = await limitsResponse.json();
    return { success: true, data: limits };
  } catch (err) {
    console.error('Error fetching live limits:', err);
    return { success: false, error: `Connection failed: ${err.message}` };
  }
});

// Show a native macOS notification (e.g. quota threshold alerts)
ipcMain.handle('claude:notify', async (event, { title, body } = {}) => {
  try {
    if (!Notification.isSupported()) {
      return { success: false, error: 'Notifications not supported on this system.' };
    }
    const notification = new Notification({ title: title || 'Claude Quota Widget', body: body || '' });
    notification.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    notification.show();
    return { success: true };
  } catch (err) {
    console.error('Error showing notification:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('claude:getHistory', async () => {
  const historyPath = path.join(currentClaudeDir, 'history.jsonl');
  return readJSONLFile(historyPath);
});

ipcMain.handle('claude:getProjects', async () => {
  const projectsPath = path.join(currentClaudeDir, 'projects');
  const projects = [];

  if (!fs.existsSync(projectsPath)) return [];

  try {
    const dirs = fs.readdirSync(projectsPath, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const dirPath = path.join(projectsPath, dir.name);
        const files = fs.readdirSync(dirPath);
        
        const sessionFiles = files.filter(f => f.endsWith('.jsonl'));
        const hasMemory = files.includes('MEMORY.md');
        let memoryContent = '';
        
        if (hasMemory) {
          memoryContent = fs.readFileSync(path.join(dirPath, 'MEMORY.md'), 'utf8');
        }

        // Gather some basic stats about the project's sessions
        const sessions = [];
        let totalSessionsCount = sessionFiles.length;
        let lastModified = 0;

        for (const file of sessionFiles) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs > lastModified) {
            lastModified = stats.mtimeMs;
          }
          sessions.push({
            sessionId: file.replace('.jsonl', ''),
            mtime: stats.mtimeMs,
            size: stats.size
          });
        }

        // Sort sessions by modification time descending
        sessions.sort((a, b) => b.mtime - a.mtime);

        projects.push({
          dirName: dir.name,
          sessionCount: totalSessionsCount,
          lastActive: lastModified || fs.statSync(dirPath).mtimeMs,
          sessions,
          hasMemory,
          memoryContent
        });
      }
    }
  } catch (err) {
    console.error('Error reading projects:', err);
  }

  // Sort projects by last active descending
  return projects.sort((a, b) => b.lastActive - a.lastActive);
});

ipcMain.handle('claude:getSessionTranscript', async (event, { dirName, sessionId }) => {
  const sessionPath = path.join(currentClaudeDir, 'projects', dirName, `${sessionId}.jsonl`);
  return readJSONLFile(sessionPath);
});

ipcMain.handle('claude:getPlans', async () => {
  const plansPath = path.join(currentClaudeDir, 'plans');
  const plans = [];

  if (!fs.existsSync(plansPath)) return [];

  try {
    const files = fs.readdirSync(plansPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(plansPath, file);
        const stats = fs.statSync(filePath);
        
        // Read the first few lines to get the title
        const content = fs.readFileSync(filePath, 'utf8');
        const firstLine = content.split('\n')[0] || '';
        const title = firstLine.startsWith('# ') ? firstLine.replace('# ', '').trim() : file;

        plans.push({
          fileName: file,
          title,
          lastModified: stats.mtimeMs,
          size: stats.size
        });
      }
    }
  } catch (err) {
    console.error('Error reading plans:', err);
  }

  return plans.sort((a, b) => b.lastModified - a.lastModified);
});

ipcMain.handle('claude:getPlanContent', async (event, fileName) => {
  const filePath = path.join(currentClaudeDir, 'plans', fileName);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error(`Error reading plan content at ${filePath}:`, err);
  }
  return '';
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
