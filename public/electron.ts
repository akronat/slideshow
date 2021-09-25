const { app, BrowserWindow, ipcMain } = require('electron');

const path = require('path');
// const url = require('url');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  const rendererEvents = {
    minimize: () => win.isMinimized() ? win.restore() : win.minimize(),
    maximize: () => win.isMaximized() ? win.unmaximize() : win.maximize(),
    close: () => win.close(),
    openDevTools: () => win.webContents.openDevTools(),
  };

  const win = new BrowserWindow({
    width: 900,
    height: 680,
    frame: false,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  win.on('closed', () => mainWindow = null);
  win.removeMenu();

  Object.entries(rendererEvents).forEach(([key, act]) => ipcMain.on(key, act));

  mainWindow = win;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
