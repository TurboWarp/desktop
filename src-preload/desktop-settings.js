const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('DesktopSettingsPreload', {
  getSettings: () => ipcRenderer.sendSync('get-settings'),
  setUpdateChecker: (updateChecker) => ipcRenderer.invoke('set-update-checker', updateChecker),
  setMicrophone: (microphone) => ipcRenderer.invoke('set-microphone', microphone),
  setCamera: (camera) => ipcRenderer.invoke('set-camera', camera),
  setHardwareAcceleration: (hardwareAcceleration) => ipcRenderer.invoke('set-hardware-acceleration', hardwareAcceleration),
  setBackgroundThrottling: (backgroundThrottling) => ipcRenderer.invoke('set-background-throttling', backgroundThrottling),
  setBypassCORS: (bypassCORS) => ipcRenderer.invoke('set-bypass-cors', bypassCORS),
  openUserData: () => ipcRenderer.invoke('open-user-data')
});
