const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('PrivacyPreload', {
  isUpdateCheckerAllowed: () => ipcRenderer.sendSync('is-update-checker-allowed'),
  openDesktopSettings: () => ipcRenderer.invoke('open-desktop-settings')
});
