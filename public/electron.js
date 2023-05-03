const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path');
const fs = require('fs');
// const url = require('url');

function electronIsDev() {
  const isEnvSet = 'ELECTRON_IS_DEV' in process.env;
  const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
  return isEnvSet ? getFromEnv : !app.isPackaged;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 680,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.removeMenu();

  if (electronIsDev()) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  }

  Object.entries({
    minimize: () => win.isMinimized() ? win.restore() : win.minimize(),
    maximize: () => win.isMaximized() ? win.unmaximize() : win.maximize(),
    close: () => win.close(),
    openDevTools: () => win.webContents.openDevTools(),
  }).forEach(([key, action]) => ipcMain.on(key, action));
}

app.whenReady().then(() => createWindow());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// Settings serialization (and caching)
let cachedSettings = undefined;
function getSettingsFilepath() {
  return path.join(app.getPath('userData'), 'settings.json');
}
const getSettings = (event) => {
  if (!cachedSettings) {
    try {
      const filepath = getSettingsFilepath();
      cachedSettings = JSON.parse(fs.readFileSync(filepath));
    } catch (e) {
      console.warn(`Error reading settings (it may not exist yet): ${e}`, e);
      return {};
    }
  }
  event.returnValue = cachedSettings;
};
const setSettings = (event, data) => {
  cachedSettings = data;
  try {
    const filepath = getSettingsFilepath();
    fs.writeFileSync(filepath, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing settings: ${e}`, e);
  }
  event.returnValue = null;
};
ipcMain.on('getSettings', getSettings);
ipcMain.on('setSettings', setSettings);