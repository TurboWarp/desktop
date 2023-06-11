import {ipcMain} from 'electron';
import {get, set} from './store';

const BYPASS_CORS_KEY = 'bypass_cors';

const canBypassCORS = () => !!get(BYPASS_CORS_KEY);

ipcMain.on('bypass-cors/get-is-enabled', (e) => {
  e.returnValue = canBypassCORS();
});

ipcMain.handle('bypass-cors/set-is-enabled', (e, enabled) => {
  set(BYPASS_CORS_KEY, enabled);
});

export {
  canBypassCORS
};
