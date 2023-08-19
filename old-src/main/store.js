// import {app} from 'electron';
// import fs from 'fs';
// import pathUtil from 'path';
// import {writeFileAtomic} from './atomic-file-write-stream';

// /**
//  * @fileoverview Simple persistent key/value JSON data store.
//  */

// const STORE_PATH = pathUtil.join(app.getPath('userData'), 'tw_config.json');

// const readStore = () => {
//   try {
//     const file = fs.readFileSync(STORE_PATH, {
//       encoding: 'utf8'
//     });
//     const parsedData = JSON.parse(file);
//     return parsedData;
//   } catch (e) {
//     // File doesn't exist or is corrupted
//     return {};
//   }
// };

// let store = readStore();

// const writeStore = async () => {
//   try {
//     await writeFileAtomic(STORE_PATH, JSON.stringify(store));
//   } catch (e) {
//     console.error('could not write store', e);
//   }
// };

// export const set = async (key, value) => {
//   if (store[key] !== value) {
//     store[key] = value;
//     await writeStore();
//   }
// };

// export const get = (key) => {
//   if (Object.prototype.hasOwnProperty.call(store, key)) {
//     return store[key];
//   }
//   return null;
// };
