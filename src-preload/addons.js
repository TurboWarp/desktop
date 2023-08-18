const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('AddonsPreload', {
  exportSettings: settings => ipcRenderer.invoke('export-settings', settings)
});

contextBridge.exposeInMainWorld('PromptsPreload', {
  alert: (message) => ipcRenderer.sendSync('alert', message),
  confirm: (message) => ipcRenderer.sendSync('confirm', message),
});
