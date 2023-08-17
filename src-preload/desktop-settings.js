const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('DesktopSettingsPreload', {

});
