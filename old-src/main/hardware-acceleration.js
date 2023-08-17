import {app, ipcMain} from 'electron';
import {get, set} from './store';

const KEY = 'hardware_acceleration';

const isHardwareAccelerationEnabled = () => {
  return get(KEY) ?? true;
};

ipcMain.on('hardware-acceleration/get-is-enabled', (event) => {
  event.returnValue = isHardwareAccelerationEnabled();
});
ipcMain.handle('hardware-acceleration/set-is-enabled', (event, enabled) => {
  set(KEY, enabled);
});

if (!isHardwareAccelerationEnabled()) {
  console.log('Hardware acceleration is DISABLED');
  app.disableHardwareAcceleration();
}
