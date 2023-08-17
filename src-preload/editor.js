const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('EditorPreload', {
  hasInitialFile: () => ipcRenderer.invoke('has-initial-file'),
  getInitialFile: () => ipcRenderer.invoke('get-initial-file'),
  setChanged: changed => ipcRenderer.invoke('changed', changed),
  closedFile: () => ipcRenderer.invoke('closed-file')
});
