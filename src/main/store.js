import {app} from 'electron';
import fs from 'fs';
import {promisify} from 'util';
import pathUtil from 'path';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * @fileoverview Simple persistent key/value JSON data store.
 * Initialized lazily. Async. Files written immediately upon change, but may not be actually flushed to disk.
 */

const STORE_PATH = pathUtil.join(app.getPath('userData'), 'tw_config.json');

let store = null;

async function initStore() {
  if (store === null) {
    store = await readStore();
  }
}

async function readStore() {
  try {
    const file = await readFile(STORE_PATH, {
      encoding: 'utf8'
    });
    const parsedData = JSON.parse(file);
    return parsedData;
  } catch (e) {
    // File doesn't exist or is corrupted
    return {};
  }
}

async function writeStore() {
  try {
    await writeFile(STORE_PATH, JSON.stringify(store));
  } catch (e) {
    console.error('could not write store', e);
  }
}

export async function set(key, value) {
  await initStore();
  store[key] = value;
  await writeStore();
}

export async function get(key) {
  await initStore();
  if (Object.prototype.hasOwnProperty.call(store, key)) {
    return store[key];
  }
  return null;
}
