import path from 'path';

export const isDevelopment = process.env.NODE_ENV !== 'production';
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';
// __static is unreliable when started with electron.exe main.js ...
export const staticDir = isDevelopment ? path.join(__dirname, '../../static') : path.join(__dirname, '../static');
