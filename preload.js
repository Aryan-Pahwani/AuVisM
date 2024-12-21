const { ipcRenderer, contextBridge } = require('electron');

// Expose ipcRenderer to the renderer process via contextBridge
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
    }
});
