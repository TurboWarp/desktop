/**
 * Partial reimplementation of the FileSystem API
 * https://web.dev/file-system-access/
 */

const {remote} = require('electron');
const dialog = remote.dialog;
const fs = require('fs');
const pathUtil = require('path');
const promisify = require('util').promisify;
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const readAsArrayBuffer = (blob) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('cannot read'));
  fr.readAsArrayBuffer(blob);
});

class WrappedFileWritable {
  constructor (path) {
    this._path = path;
  }

  async write (content) {
    if (content instanceof Blob) {
      const arrayBuffer = await readAsArrayBuffer(content);
      await writeFile(this._path, Buffer.from(new Uint8Array(arrayBuffer)));
    }
  }

  async close () {
    // no-op
  }
}

class WrappedFileHandle {
  constructor (path) {
    this._path = path;
    // part of public API
    this.name = pathUtil.basename(this._path);
  }

  async getFile () {
    const data = await readFile(this._path);
    const blob = new Blob([data.buffer]);
    return new File([blob], this.name);
  }

  async createWritable () {
    return new WrappedFileWritable(this._path);
  }
}

class AbortError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AbortError';
  }
}

/*
Input:
[
  {
    description: 'Scratch 3 Project',
    accept: {
      'application/x.scratch.sb3': ['.sb', '.sb2', '.sb3'] <-- could also be just a string
    }
  }
]

Output:
[
  {
    name: 'Scratch 3 Project',
    extensions: ['sb', 'sb2', 'sb3']
  }
]
*/
const typesToFilterList = (types) => types.map((type) => ({
  name: type.description,
  extensions: Object.values(type.accept)
    .flat()
    .map((i) => i.substr(1))
}));

window.showSaveFilePicker = async (options) => {
  const result = await dialog.showSaveDialog({
    filters: typesToFilterList(options.types)
  });

  if (result.canceled) {
    throw new AbortError('Operation was cancelled by user.');
  }

  const filePath = result.filePath;
  return new WrappedFileHandle(filePath);
};

window.showOpenFilePicker = async (options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: typesToFilterList(options.types)
  });

  if (result.canceled) {
    throw new AbortError('Operation was cancelled by user.');
  }

  const [filePath] = result.filePaths;
  return [new WrappedFileHandle(filePath)];
};
