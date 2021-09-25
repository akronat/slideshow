// This module has corresponding type declarations in electronIpc.ts that
// need to be kept in sync!
const {
  contextBridge,
  ipcRenderer,
} = require("electron");
const path = require('path');
const fs = require('fs');

const sendableChannels = ['minimize', 'maximize', 'close', 'openDevTools'];
const receiveableChannels = [];

// Settings stuff
let cachedSettings = undefined;
function getSettingsFilepath() {
  return path.join(ipcRenderer.sendSync('userDataPath'), 'settings.json');
}
const getSettings = () => {
  if (!cachedSettings) {
    try {
      const filepath = getSettingsFilepath();
      cachedSettings = JSON.parse(fs.readFileSync(filepath));
    } catch (e) {
      console.warn(`Error reading settings (it may not exist yet): ${e}`, e);
      return {};
    }
  }
  return cachedSettings;
};
const setSettings = (data) => {
  cachedSettings = data;
  try {
    const filepath = getSettingsFilepath();
    fs.writeFileSync(filepath, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing settings: ${e}`, e);
  }
};

// Expose protected methods for the renderer process to use
contextBridge.exposeInMainWorld('electronIpc', {
  send: (channel, data) => sendableChannels.includes(channel) && ipcRenderer.send(channel, data),
  // Deliberately strip event as it includes `sender` 
  receive: (channel, func) => receiveableChannels.includes(channel) && ipcRenderer.on(channel, (event, ...args) => func(...args)),
  getSettings,
  setSettings,
});

