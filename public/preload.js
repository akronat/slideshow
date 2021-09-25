const {
  contextBridge,
  ipcRenderer
} = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "electronIpc", {
      send: (channel, data) => ipcRenderer.send(channel, data),
      // Deliberately strip event as it includes `sender` 
      receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  }
);
