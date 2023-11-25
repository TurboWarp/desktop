const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('MigratePreload', {
  getInfo: () => ipcRenderer.sendSync('get-info'),
  done: () => ipcRenderer.invoke('done'),
  continueAnyways: () => ipcRenderer.invoke('continue-anyways')
});
