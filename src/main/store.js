import {app} from 'electron';
import fs from 'fs';
import pathUtil from 'path';

/**
 * @fileoverview Simple persistent key/value JSON data store.
 */

const STORE_PATH = pathUtil.join(app.getPath('userData'), 'tw_config.json');

let store = readStore();

function readStore() {
  try {
    const file = fs.readFileSync(STORE_PATH, {
      encoding: 'utf8'
    });
    const parsedData = JSON.parse(file);
    return parsedData;
  } catch (e) {
    // File doesn't exist or is corrupted
    return {};
  }
}

function writeStore() {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
  } catch (e) {
    console.error('could not write store', e);
  }
}

export function set(key, value) {
  if (store[key] !== value) {
    store[key] = value;
    writeStore();
  }
}

export function get(key) {
  if (Object.prototype.hasOwnProperty.call(store, key)) {
    return store[key];
  }
  return null;
}
