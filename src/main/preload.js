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

// This hack seems to be the only way for the renderer process to be able to transfer
// a MessagePort to the main thread.
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) {
    return;
  }
  if (e.data.ipcPostMessagePassthrough) {
    const {channel, data} = e.data.ipcPostMessagePassthrough;
    ipcRenderer.postMessage(channel, data, e.ports);
  }
});
