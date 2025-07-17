const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('GlobalPackagerImporter', () => new Promise((resolve, reject) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = (e) => {
    const data = e.data;
    if (data.error) {
      reject(new Error('Failed to import'));
    } else {
      resolve({
        name: `${data.name}.sb3`,
        data: data.data
      });
    }
  };
  ipcRenderer.postMessage('import-project-with-port', null, [channel.port2]);
}));

contextBridge.exposeInMainWorld('PromptsPreload', {
  alert: (message) => ipcRenderer.sendSync('alert', message),
  confirm: (message) => ipcRenderer.sendSync('confirm', message),
});

contextBridge.exposeInMainWorld('IsDesktop', true);

// In some Linux environments, people may try to drag & drop files that we don't have access to.
// Remove when https://github.com/electron/electron/issues/30650 is fixed.
if (navigator.userAgent.includes('Linux')) {
  document.addEventListener('drop', (e) => {
    if (e.isTrusted) {
      for (const file of e.dataTransfer.files) {
        // Using webUtils is safe as we don't have a legacy build for Linux
        const {webUtils} = require('electron');
        const path = webUtils.getPathForFile(file);
        ipcRenderer.invoke('check-drag-and-drop-path', path);
      }
    }
  }, {
    capture: true
  });
}
