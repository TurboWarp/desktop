import {ipcMain} from 'electron';
import {version} from '../../package.json';

ipcMain.handle('get-debug-info', () => ({
  version: version,
  NODE_ENV: process.env.NODE_ENV || 'development',
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron
}));
