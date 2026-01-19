const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let steamClient = null;
let steamInitialized = false;

// Steam Input state
let steamInputInitialized = false;
let steamInputActions = {};
let steamInputControllers = [];
let inputPollInterval = null;

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

      // Initialize Steam Input
      initSteamInput();

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

// Initialize Steam Input for controller support
function initSteamInput() {
  try {
    if (!steamClient || !steamClient.input) {
      console.log('[Steam Input] Not available');
      return;
    }

    steamClient.input.init();
    steamInputInitialized = true;
    console.log('[Steam Input] Initialized');

    // Get action handles for our game actions
    steamInputActions = {
      actionSet: steamClient.input.getActionSet('GameControls'),
      confirm: steamClient.input.getDigitalAction('confirm'),
      cancel: steamClient.input.getDigitalAction('cancel'),
      autoTarget: steamClient.input.getDigitalAction('auto_target'),
      tooltip: steamClient.input.getDigitalAction('tooltip'),
      menu: steamClient.input.getDigitalAction('menu'),
      prevUnit: steamClient.input.getDigitalAction('prev_unit'),
      nextUnit: steamClient.input.getDigitalAction('next_unit'),
      prevSigil: steamClient.input.getDigitalAction('prev_sigil'),
      nextSigil: steamClient.input.getDigitalAction('next_sigil'),
      switchSides: steamClient.input.getDigitalAction('switch_sides'),
      dpadUp: steamClient.input.getDigitalAction('dpad_up'),
      dpadDown: steamClient.input.getDigitalAction('dpad_down'),
      dpadLeft: steamClient.input.getDigitalAction('dpad_left'),
      dpadRight: steamClient.input.getDigitalAction('dpad_right'),
      move: steamClient.input.getAnalogAction('Move')
    };

    console.log('[Steam Input] Actions loaded:', Object.keys(steamInputActions).length);

    // Start polling for input
    inputPollInterval = setInterval(pollSteamInput, 16); // ~60fps

  } catch (e) {
    console.warn('[Steam Input] Init failed:', e.message);
    steamInputInitialized = false;
  }
}

// Poll Steam Input and send to renderer
function pollSteamInput() {
  if (!steamInputInitialized || !steamClient || !mainWindow) return;

  try {
    // Get connected controllers
    steamInputControllers = steamClient.input.getControllers();

    if (steamInputControllers.length === 0) return;

    const controller = steamInputControllers[0];

    // Activate our action set
    if (steamInputActions.actionSet) {
      controller.activateActionSet(steamInputActions.actionSet);
    }

    // Build input state object
    const inputState = {
      // Digital actions (buttons)
      confirm: controller.isDigitalActionPressed(steamInputActions.confirm),
      cancel: controller.isDigitalActionPressed(steamInputActions.cancel),
      autoTarget: controller.isDigitalActionPressed(steamInputActions.autoTarget),
      tooltip: controller.isDigitalActionPressed(steamInputActions.tooltip),
      menu: controller.isDigitalActionPressed(steamInputActions.menu),
      prevUnit: controller.isDigitalActionPressed(steamInputActions.prevUnit),
      nextUnit: controller.isDigitalActionPressed(steamInputActions.nextUnit),
      prevSigil: controller.isDigitalActionPressed(steamInputActions.prevSigil),
      nextSigil: controller.isDigitalActionPressed(steamInputActions.nextSigil),
      switchSides: controller.isDigitalActionPressed(steamInputActions.switchSides),
      dpadUp: controller.isDigitalActionPressed(steamInputActions.dpadUp),
      dpadDown: controller.isDigitalActionPressed(steamInputActions.dpadDown),
      dpadLeft: controller.isDigitalActionPressed(steamInputActions.dpadLeft),
      dpadRight: controller.isDigitalActionPressed(steamInputActions.dpadRight),
      // Analog actions (stick)
      move: controller.getAnalogActionVector(steamInputActions.move)
    };

    // Send to renderer
    mainWindow.webContents.send('steam-input-state', inputState);

  } catch (e) {
    // Don't spam console on every poll error
  }
}

// ============================================
// IPC Handlers for Steam API
// ============================================

// Connection status
ipcMain.on('steam-initialized', (event) => {
  event.returnValue = steamInitialized;
});

// Steam Input status
ipcMain.on('steam-input-initialized', (event) => {
  event.returnValue = steamInputInitialized;
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
