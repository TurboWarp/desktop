const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('AddonsPreload', {
  exportSettings: settings => ipcRenderer.invoke('export-settings', settings)
});
