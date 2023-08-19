// import {app, ipcMain} from 'electron';
// import fs from 'fs';
// import pathUtil from 'path';

// const JS_PATH = pathUtil.join(app.getPath('userData'), 'userscript.js');
// const CSS_PATH = pathUtil.join(app.getPath('userData'), 'userstyle.css');

// let js = '';
// let css = '';
// try {
//     js = fs.readFileSync(JS_PATH, 'utf-8');
// } catch (e) {
//     // ignore
// }
// try {
//     css = fs.readFileSync(CSS_PATH, 'utf-8');
// } catch (e) {
//     // ignore
// }

// ipcMain.handle('get-user-customizations', () => {
//     return {js, css};
// });
