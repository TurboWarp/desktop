const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('UpdatePreload', {
  getInfo: () => ipcRenderer.sendSync('get-info'),
  download: () => ipcRenderer.invoke('download'),
  ignore: (permanently) => ipcRenderer.invoke('ignore', permanently)
});
