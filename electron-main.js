const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================
// File-based diagnostic logging
// Console output is invisible on Steam Deck, so write to a crash log file
// ============================================
const logPath = path.join(app.getPath('userData'), 'froggle-crash.log');

function logToFile(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath, line);
  } catch (e) {
    // Can't even write to log - nothing we can do
  }
}

// Start fresh log each launch
try {
  fs.writeFileSync(logPath, `=== FROGGLE Launch ${new Date().toISOString()} ===\n`);
  fs.appendFileSync(logPath, `Platform: ${process.platform}, Arch: ${process.arch}\n`);
  fs.appendFileSync(logPath, `Electron: ${process.versions.electron}, Chrome: ${process.versions.chrome}\n`);
  fs.appendFileSync(logPath, `Node: ${process.versions.node}\n`);
  fs.appendFileSync(logPath, `Args: ${process.argv.join(' ')}\n`);
  fs.appendFileSync(logPath, `Log path: ${logPath}\n\n`);
} catch (e) {
  // Ignore - userData may not exist yet
}

// Catch uncaught exceptions in main process to prevent silent crashes
process.on('uncaughtException', (error) => {
  console.error('[FROGGLE-MAIN] Uncaught exception:', error);
  logToFile(`UNCAUGHT EXCEPTION: ${error.stack || error.message || error}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FROGGLE-MAIN] Unhandled rejection:', reason);
  logToFile(`UNHANDLED REJECTION: ${reason}`);
});

// ============================================
// Chromium flags for Steam Deck / Linux stability
// ============================================

// CRITICAL: Disable Chromium sandbox - SteamOS runs in a container environment
// that conflicts with Chromium's own sandbox, causing immediate crashes
app.commandLine.appendSwitch('no-sandbox');

// GPU stability: run GPU operations in the main process to prevent
// GPU process crashes from killing the entire app
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// Enable Gamepad API support in Chromium
app.commandLine.appendSwitch('enable-gamepad-extensions');
app.commandLine.appendSwitch('enable-features', 'GamepadButtonAxisEvents');

logToFile('Chromium flags configured');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let steamClient = null;
let steamInitialized = false;

// Initialize Steam (for achievements, stats, cloud saves - NOT controller input)
// Called AFTER window creation so a native crash here doesn't prevent the window
function initSteam() {
  logToFile('initSteam() starting...');
  try {
    const steamworks = require('steamworks.js');
    logToFile('steamworks.js module loaded');

    // Initialize with your App ID (reads from steam_appid.txt in dev)
    steamClient = steamworks.init();
    logToFile('steamworks.init() completed');

    if (steamClient) {
      steamInitialized = true;
      const userName = steamClient.localplayer.getName();
      console.log('[Steam] Initialized successfully');
      console.log('[Steam] User:', userName);
      logToFile(`Steam initialized: user=${userName}`);

      // Run Steam callbacks periodically
      setInterval(() => {
        if (steamClient) {
          try {
            steamClient.runCallbacks();
          } catch (e) {
            console.warn('[Steam] Callback error:', e.message);
          }
        }
      }, 100);
    } else {
      logToFile('steamworks.init() returned null');
    }
  } catch (e) {
    console.log('[Steam] Not available:', e.message);
    logToFile(`Steam init error: ${e.message}`);
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
    // activate() only sets the achievement in memory — store() flushes to Steam servers
    if (result) {
      steamClient.stats.store();
    }
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
    if (result) steamClient.stats.store();
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
    steamClient.stats.store();
    event.returnValue = true;
  } catch (e) {
    event.returnValue = false;
  }
});

// Stats — float stats must use setFloat/getFloat (configured in Steam dashboard)
const FLOAT_STATS = new Set(['fastest_win_seconds']);

ipcMain.on('steam-set-stat', (event, statName, value) => {
  if (!steamInitialized || !steamClient) {
    event.returnValue = false;
    return;
  }
  try {
    if (FLOAT_STATS.has(statName)) {
      steamClient.stats.setFloat(statName, value);
    } else {
      steamClient.stats.setInt(statName, Math.floor(value));
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
    if (FLOAT_STATS.has(statName)) {
      event.returnValue = steamClient.stats.getFloat(statName) || 0;
    } else {
      event.returnValue = steamClient.stats.getInt(statName) || 0;
    }
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
    const steamId = steamClient.localplayer.getSteamId();
    event.returnValue = {
      name: steamClient.localplayer.getName(),
      // steamId64 is a bigint — convert to string to avoid JSON.stringify crashes
      steamId: steamId.steamId64.toString()
    };
  } catch (e) {
    event.returnValue = null;
  }
});

// ============================================
// Window Management
// ============================================

function createWindow() {
  logToFile('createWindow() starting...');

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

  logToFile('BrowserWindow created');

  // Maximize window on start
  mainWindow.maximize();

  // Load the game
  mainWindow.loadFile('index.html');
  logToFile('loadFile(index.html) called');

  // Track page load progress
  mainWindow.webContents.on('did-start-loading', () => {
    logToFile('Page: did-start-loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    logToFile('Page: dom-ready');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logToFile('Page: did-finish-load (SUCCESS)');
  });

  // Open DevTools in development (press F12)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Handle renderer crashes - log details instead of silently dying
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    const msg = `Renderer CRASHED: reason=${details.reason}, exitCode=${details.exitCode}`;
    console.error('[FROGGLE-MAIN]', msg);
    logToFile(msg);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    const msg = `Page FAILED to load: code=${errorCode}, desc=${errorDescription}`;
    console.error('[FROGGLE-MAIN]', msg);
    logToFile(msg);
  });

  // Handle window close
  mainWindow.on('closed', () => {
    logToFile('Window closed');
    mainWindow = null;
  });

  // Prevent accidental navigation away
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  logToFile('app.whenReady() fired');

  // Create window FIRST - if Steam init crashes natively (SIGSEGV),
  // at least the window will exist and show the error handler
  createWindow();

  // Initialize Steam AFTER window exists
  initSteam();

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

// Handle Alt+F4 to quit (useful for Steam Deck)
app.on('browser-window-focus', () => {
  globalShortcut.register('Alt+F4', () => {
    app.quit();
  });
});

app.on('browser-window-blur', () => {
  globalShortcut.unregister('Alt+F4');
});
