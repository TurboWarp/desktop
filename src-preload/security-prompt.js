const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('SecurityPromptPreload', {
  init: () => ipcRenderer.sendSync('init'),
  ready: (options) => ipcRenderer.invoke('ready', options),
  allow: () => ipcRenderer.invoke('done', true),
  deny: () => ipcRenderer.invoke('done', false),
});
