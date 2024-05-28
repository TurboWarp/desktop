const {ipcRenderer, contextBridge} = require('electron');

let newPathCallback = () => {};

contextBridge.exposeInMainWorld('FileAccessPreload', {
  init: () => ipcRenderer.sendSync('init'),
  onNewPath: (callback) => {
    newPathCallback = callback;
  }
});

ipcRenderer.on('new-path', (event, path) => {
  newPathCallback(path);
});
