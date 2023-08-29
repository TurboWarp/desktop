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

// Donation link must be hidden in MAS builds for App store compliance
if (ipcRenderer.sendSync('is-mas')) {
  const style = document.createElement('style');
  style.textContent = '.donate-link { display: none !important; }';
  // No DOM exists yet when preload script runs
  document.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(style);
  });
}
