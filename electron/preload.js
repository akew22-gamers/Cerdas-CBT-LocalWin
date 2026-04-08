const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  
  onServerStatus: (callback) => {
    ipcRenderer.on('server-status', (event, data) => callback(data));
  },
  onServerLog: (callback) => {
    ipcRenderer.on('server-log', (event, log) => callback(log));
  },
  onDataDir: (callback) => {
    ipcRenderer.on('data-dir', (event, dir) => callback(dir));
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});