const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('AddCustomExtensionPreload', {
  getInfo: () => ipcRenderer.sendSync('get-info'),
  done: (url, forceUnsandboxed) => ipcRenderer.invoke('done', url, forceUnsandboxed)
});
