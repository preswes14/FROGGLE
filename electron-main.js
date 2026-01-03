const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

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
      contextIsolation: true
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
