const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('DesktopSettingsPreload', {
  init: () => ipcRenderer.sendSync('init'),
  setUpdateChecker: (updateChecker) => ipcRenderer.invoke('set-update-checker', updateChecker),
  enumerateMediaDevices: () => ipcRenderer.invoke('enumerate-media-devices'),
  setMicrophone: (microphone) => ipcRenderer.invoke('set-microphone', microphone),
  setCamera: (camera) => ipcRenderer.invoke('set-camera', camera),
  setHardwareAcceleration: (hardwareAcceleration) => ipcRenderer.invoke('set-hardware-acceleration', hardwareAcceleration),
  setBackgroundThrottling: (backgroundThrottling) => ipcRenderer.invoke('set-background-throttling', backgroundThrottling),
  setBypassCORS: (bypassCORS) => ipcRenderer.invoke('set-bypass-cors', bypassCORS),
  setSpellchecker: (spellchecker) => ipcRenderer.invoke('set-spellchecker', spellchecker),
  setExitFullscreenOnEscape: (exitFullscreenOnEscape) => ipcRenderer.invoke('set-exit-fullscreen-on-escape', exitFullscreenOnEscape),
  setRichPresence: (richPresence) => ipcRenderer.invoke('set-rich-presence', richPresence),
  openUserData: () => ipcRenderer.invoke('open-user-data')
});
