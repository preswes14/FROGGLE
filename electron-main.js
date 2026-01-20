const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let steamClient = null;
let steamInitialized = false;

// Initialize Steam
function initSteam() {
  try {
    const steamworks = require('steamworks.js');

    // Initialize with your App ID (reads from steam_appid.txt in dev)
    steamClient = steamworks.init();

    if (steamClient) {
      steamInitialized = true;
      console.log('[Steam] Initialized successfully');
      console.log('[Steam] User:', steamClient.localplayer.getName());

      // Run Steam callbacks periodically (wrapped in try/catch for Steam Deck stability)
      setInterval(() => {
        if (steamClient) {
          try {
            steamClient.runCallbacks();
          } catch (e) {
            console.warn('[Steam] Callback error:', e.message);
          }
        }
      }, 100);
    }
  } catch (e) {
    console.log('[Steam] Not available:', e.message);
    steamInitialized = false;
  }
}

// ============================================
// IPC Handlers for Steam API
// ============================================

// Connection status
ipcMain.on('steam-initialized', (event) => {
  event.returnValue = steamInitialized;
});

// Achievements
ipcMain.on('steam-unlock-achievement', (event, achievementId) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    const result = steamClient.achievement.activate(achievementId);
    event.returnValue = result;
  } catch (e) {
    console.warn('[Steam] Unlock failed:', e);
    event.returnValue = false;
  }
});

ipcMain.on('steam-get-achievements', (event) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = [];
    return;
  }
  try {
    // Get all achievements and filter to unlocked ones
    const achievements = steamClient.achievement.getAll();
    const unlocked = achievements.filter(a => a.achieved).map(a => a.name);
    event.returnValue = unlocked;
  } catch (e) {
    event.returnValue = [];
  }
});

ipcMain.on('steam-clear-achievement', (event, achievementId) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    const result = steamClient.achievement.clear(achievementId);
    event.returnValue = result;
  } catch (e) {
    event.returnValue = false;
  }
});

ipcMain.on('steam-clear-all-achievements', (event) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    const achievements = steamClient.achievement.getAll();
    achievements.forEach(a => steamClient.achievement.clear(a.name));
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});

// Stats
ipcMain.on('steam-set-stat', (event, statName, value) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    if (Number.isInteger(value)) {
      steamClient.stats.setInt(statName, value);
    } else {
      steamClient.stats.setFloat(statName, value);
    }
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});

ipcMain.on('steam-get-stat', (event, statName) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = 0;
    return;
  }
  try {
    // Try int first, then float
    const intVal = steamClient.stats.getInt(statName);
    if (intVal !== undefined) {
      event.returnValue = intVal;
      return;
    }
    const floatVal = steamClient.stats.getFloat(statName);
    event.returnValue = floatVal || 0;
  } catch (e) {
    event.returnValue = 0;
  }
});

ipcMain.on('steam-store-stats', (event) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    steamClient.stats.store();
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});

// Cloud Save
ipcMain.on('steam-cloud-save', (event, filename, data) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    const buffer = Buffer.from(data, 'utf8');
    steamClient.cloud.writeFile(filename, buffer);
    event.returnValue = true;
  } catch (e) {
    console.warn('[Steam] Cloud save error:', e);
    event.returnValue = false;
  }
});

ipcMain.on('steam-cloud-load', (event, filename) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = null;
    return;
  }
  try {
    if (!steamClient.cloud.isEnabledForAccount() || !steamClient.cloud.isEnabledForApp()) {
      event.returnValue = null;
      return;
    }
    const buffer = steamClient.cloud.readFile(filename);
    if (buffer) {
      event.returnValue = buffer.toString('utf8');
    } else {
      event.returnValue = null;
    }
  } catch (e) {
    event.returnValue = null;
  }
});

ipcMain.on('steam-cloud-exists', (event, filename) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    event.returnValue = steamClient.cloud.fileExists(filename);
  } catch (e) {
    event.returnValue = false;
  }
});

ipcMain.on('steam-cloud-delete', (event, filename) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    steamClient.cloud.deleteFile(filename);
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});

ipcMain.on('steam-cloud-quota', (event) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = null;
    return;
  }
  try {
    const quota = steamClient.cloud.getQuota();
    event.returnValue = quota;
  } catch (e) {
    event.returnValue = null;
  }
});

// User Info
ipcMain.on('steam-get-user-info', (event) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = null;
    return;
  }
  try {
    event.returnValue = {
      name: steamClient.localplayer.getName(),
      steamId: steamClient.localplayer.getSteamId().steamId64
    };
  } catch (e) {
    event.returnValue = null;
  }
});

// ============================================
// Window Management
// ============================================

function createWindow() {
  // Create the browser window - let Steam handle fullscreen
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    backgroundColor: '#1a1a2e'
  });

  // Maximize window on start (works better with Steam than fullscreen)
  mainWindow.maximize();

  // Load the game
  mainWindow.loadFile('index.html');

  // Open DevTools in development (press F12)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent accidental navigation away
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Only allow local file navigation
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  // Initialize Steam before creating window
  initSteam();

  createWindow();

  // macOS: recreate window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle Escape key to quit (useful for Steam Deck)
app.on('browser-window-focus', () => {
  globalShortcut.register('Alt+F4', () => {
    app.quit();
  });
});

app.on('browser-window-blur', () => {
  globalShortcut.unregister('Alt+F4');
});
