const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('UpdatePreload', {
  getStrings: () => ipcRenderer.sendSync('get-strings'),
  getInfo: () => ipcRenderer.sendSync('get-info'),
  download: () => ipcRenderer.invoke('download'),
  ignore: (permanently) => ipcRenderer.invoke('ignore', permanently)
});
