// This module has corresponding type declarations in electronIpc.ts that
// need to be kept in sync!
const {
  contextBridge,
  ipcRenderer,
} = require("electron");

const plainFunctions = [
  'minimize',
  'maximize',
  'close',
  'openDevTools',
];

contextBridge.exposeInMainWorld('electronIpc', {
  getSettings: () => ipcRenderer.sendSync('getSettings'),
  setSettings: (data) => ipcRenderer.sendSync('setSettings', data),
  ...Object.fromEntries(plainFunctions.map((funcName) => [
    funcName, () => ipcRenderer.send(funcName),
  ])),
});

