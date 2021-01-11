import {app} from 'electron';
import fs from 'fs';
import pathUtil from 'path';

/**
 * @fileoverview Simple persistent key/value JSON data store.
 * Initialized lazily. Files written immediately upon change, but may not be actually flushed to disk.
 */

const STORE_PATH = pathUtil.join(app.getPath('userData'), 'tw_config.json');

let store = null;

function initStore() {
  if (store === null) {
    store = readStore();
  }
}

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
  initStore();
  store[key] = value;
  writeStore();
}

export function get(key) {
  initStore();
  if (Object.prototype.hasOwnProperty.call(store, key)) {
    return store[key];
  }
  return null;
}
