const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send(...args) {
      return ipcRenderer.send(...args);
    },
    sendTo(...args) {
      return ipcRenderer.sendTo(...args);
    },
    sendSync(...args) {
      return ipcRenderer.sendSync(...args);
    },
    invoke(...args) {
      return ipcRenderer.invoke(...args);
    },
    on(...args) {
      return ipcRenderer.on(...args);
    },
    once(...args) {
      return ipcRenderer.once(...args);
    },
    removeListener(...args) {
      return ipcRenderer.removeListener(...args);
    },
  }
});

contextBridge.exposeInMainWorld('TWD', {
  versions: {
    electron: process.versions.electron,
    extra: process.env.TW_EXTRA_BUILD_INFO
  }
});
