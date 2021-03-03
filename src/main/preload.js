const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('TWD', {
  sourceMapSupport: require('source-map-support/source-map-support.js')
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send(...args) {
      return ipcRenderer.send(...args);
    },
    invoke(...args) {
      return ipcRenderer.invoke(...args);
    },
    on(...args) {
      return ipcRenderer.on(...args);
    }
  }
});
