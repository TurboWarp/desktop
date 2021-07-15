/**
 * Partial reimplementation of the FileSystem API
 * https://web.dev/file-system-access/
 */

import {ipcRenderer} from 'electron';

const getBasename = (path) => {
  const match = path.match(/([^/\\]+)$/);
  if (!match) return null;
  return match[1];
};

const readAsArrayBuffer = (blob) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('cannot read'));
  fr.readAsArrayBuffer(blob);
});

class WrappedFileWritable {
  constructor (path) {
    // non-standard, used internally
    this.path = path;
  }

  async write (content) {
    if (content instanceof Blob) {
      const arrayBuffer = await readAsArrayBuffer(content);
      await ipcRenderer.invoke('write-file', this.path, Buffer.from(new Uint8Array(arrayBuffer)));
    }
  }

  async close () {
    // no-op
  }
}

export class WrappedFileHandle {
  constructor (path) {
    // non-standard, used internally and by DesktopComponent
    this.path = path;
    // part of public API
    this.name = getBasename(this.path);
  }

  async getFile () {
    const data = await ipcRenderer.invoke('read-file', this.path);
    return new File([data], this.name);
  }

  async createWritable () {
    return new WrappedFileWritable(this.path);
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

const storeFilePathInURL = (filePath) => {
  // Store the file path in the URL so that it will be loaded if the window reloads.
  const urlParameters = new URLSearchParams(location.search);
  urlParameters.set('file', filePath);
  history.replaceState('', '', '?' + urlParameters.toString());
};

window.showSaveFilePicker = async (options) => {
  const result = await ipcRenderer.invoke('show-save-dialog', {
    filters: typesToFilterList(options.types),
    suggestedName: options.suggestedName
  });

  if (result.canceled) {
    throw new AbortError('Operation was cancelled by user.');
  }

  const filePath = result.filePath;
  storeFilePathInURL(filePath);
  return new WrappedFileHandle(filePath);
};

window.showOpenFilePicker = async (options) => {
  const result = await ipcRenderer.invoke('show-open-dialog', {
    filters: typesToFilterList(options.types)
  });

  if (result.canceled) {
    throw new AbortError('Operation was cancelled by user.');
  }

  const [filePath] = result.filePaths;
  storeFilePathInURL(filePath);
  return [new WrappedFileHandle(filePath)];
};
