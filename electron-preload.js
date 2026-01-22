// Electron Preload Script
// Bridges Steam API from main process to renderer securely via contextBridge
// Note: Controller input uses the standard Web Gamepad API, not Steam Input

const { contextBridge, ipcRenderer } = require('electron');

// Expose Steam bridge to renderer (achievements, stats, cloud saves only)
contextBridge.exposeInMainWorld('steamBridge', {
  // Connection status
  get initialized() {
    return ipcRenderer.sendSync('steam-initialized');
  },

  // Achievements
  unlockAchievement: (id) => ipcRenderer.sendSync('steam-unlock-achievement', id),
  getUnlockedAchievements: () => ipcRenderer.sendSync('steam-get-achievements'),
  clearAchievement: (id) => ipcRenderer.sendSync('steam-clear-achievement', id),
  clearAllAchievements: () => ipcRenderer.sendSync('steam-clear-all-achievements'),

  // Stats
  setStat: (name, value) => ipcRenderer.sendSync('steam-set-stat', name, value),
  getStat: (name) => ipcRenderer.sendSync('steam-get-stat', name),
  storeStats: () => ipcRenderer.sendSync('steam-store-stats'),

  // Cloud Save
  cloudSave: (filename, data) => ipcRenderer.sendSync('steam-cloud-save', filename, data),
  cloudLoad: (filename) => ipcRenderer.sendSync('steam-cloud-load', filename),
  cloudExists: (filename) => ipcRenderer.sendSync('steam-cloud-exists', filename),
  cloudDelete: (filename) => ipcRenderer.sendSync('steam-cloud-delete', filename),
  cloudQuota: () => ipcRenderer.sendSync('steam-cloud-quota'),

  // User Info
  getUserInfo: () => ipcRenderer.sendSync('steam-get-user-info')
});

// Expose platform info
contextBridge.exposeInMainWorld('electronInfo', {
  platform: process.platform,
  isElectron: true
});
