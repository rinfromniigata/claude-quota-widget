const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claudeAPI', {
  getStats: () => ipcRenderer.invoke('claude:getStats'),
  getSettings: () => ipcRenderer.invoke('claude:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('claude:saveSettings', settings),
  getHistory: () => ipcRenderer.invoke('claude:getHistory'),
  getProjects: () => ipcRenderer.invoke('claude:getProjects'),
  getSessionTranscript: (dirName, sessionId) => ipcRenderer.invoke('claude:getSessionTranscript', { dirName, sessionId }),
  getPlans: () => ipcRenderer.invoke('claude:getPlans'),
  getPlanContent: (fileName) => ipcRenderer.invoke('claude:getPlanContent', fileName),
  
  // Profile management APIs
  getProfiles: () => ipcRenderer.invoke('claude:getProfiles'),
  switchProfile: (dirName) => ipcRenderer.invoke('claude:switchProfile', dirName),
  
  // Custom Tracker Settings (profile-specific)
  getTrackerSettings: () => ipcRenderer.invoke('claude:getTrackerSettings'),
  saveTrackerSettings: (settings) => ipcRenderer.invoke('claude:saveTrackerSettings', settings),
  
  // Live Claude Server Limits
  fetchLiveLimits: (sessionKey) => ipcRenderer.invoke('claude:fetchLiveLimits', sessionKey),

  // Native macOS notifications
  notify: (payload) => ipcRenderer.invoke('claude:notify', payload),
  
  // Real-time synchronization event listener
  onDataChanged: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('claude:data-changed', subscription);
    return () => ipcRenderer.removeListener('claude:data-changed', subscription);
  },
  
  // Window visibility show event listener
  onWindowShown: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('claude:window-shown', subscription);
    return () => ipcRenderer.removeListener('claude:window-shown', subscription);
  }
});
