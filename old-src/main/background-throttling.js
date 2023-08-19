// import {ipcMain} from 'electron';
// import {get, set} from './store';

// const BACKGROUND_THROTTLING_KEY = 'background_throttling';

// const isBackgroundThrottlingEnabled = () => get(BACKGROUND_THROTTLING_KEY) !== false;

// /** @type {Array<(enabled: boolean): void>} */
// const changeCallbacks = [];
// const whenBackgroundThrottlingChanged = (callback) => {
//   changeCallbacks.push(callback);
// };

// ipcMain.on('background-throttling/get-is-enabled', (e) => {
//   e.returnValue = isBackgroundThrottlingEnabled();
// });

// ipcMain.handle('background-throttling/set-is-enabled', (e, enabled) => {
//   set(BACKGROUND_THROTTLING_KEY, enabled);
//   for (const callback of changeCallbacks) {
//     callback(enabled);
//   }
// });

// export {
//   isBackgroundThrottlingEnabled,
//   whenBackgroundThrottlingChanged
// };
