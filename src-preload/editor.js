const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('EditorPreload', {
  hasFile: () => ipcRenderer.invoke('has-file'),
  getFile: () => ipcRenderer.invoke('get-file'),
  openedFile: () => ipcRenderer.invoke('opened-file'),
  closedFile: () => ipcRenderer.invoke('closed-file'),
  showSaveFilePicker: suggestedName => ipcRenderer.invoke('show-save-file-picker', suggestedName),
  showOpenFilePicker: () => ipcRenderer.invoke('show-open-file-picker'),
  setChanged: (changed) => ipcRenderer.invoke('set-changed', changed),
  openAddonSettings: () => ipcRenderer.invoke('open-addon-settings')
});

window.addEventListener('message', (e) => {
  if (e.source === window && e.data === 'start-write-stream') {
    ipcRenderer.postMessage('start-write-stream', null, e.ports);
  }
});
