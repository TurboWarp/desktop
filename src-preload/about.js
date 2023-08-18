const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('AboutPreload', {
  getInfo: () => ipcRenderer.sendSync('get-info')
});
