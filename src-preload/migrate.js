const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('MigratePreload', {
  getStrings: () => ipcRenderer.sendSync('get-strings'),
  done: () => ipcRenderer.invoke('done')
});
