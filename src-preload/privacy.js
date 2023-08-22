const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('PrivacyPreload', {
  openDesktopSettings: () => ipcRenderer.invoke('open-desktop-settings')
});
