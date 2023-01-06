import fs from 'fs';
import {promisify} from 'util';

// This file was initially based on:
// https://github.com/npm/write-file-atomic/blob/a37fdc843f4d391cf1cff85c8e69c3d80e05b049/lib/index.js

const getTemporaryPath = (originalPath) => {
  // The temporary file needs to be located on the same physical disk as the actual file,
  // otherwise we won't be able to rename it.
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += Math.floor(Math.random() * 10).toString();
  }
  return originalPath + '.tw' + random;
};

const getOriginalMode = async (path) => {
  try {
    const stat = await promisify(fs.stat)(path);
    return stat.mode;
  } catch (e) {
    // read and write for all users
    return 0o666;
  }
};

/**
 * @type {Map<string, Array<() => void>>}
 */
const fileLockQueues = new Map();

const acquireFileLock = async (path) => {
  let queue = fileLockQueues.get(path);
  if (queue) {
    await new Promise((resolve) => {
      queue.push(resolve);
    });
  } else {
    fileLockQueues.set(path, []);
  }

  const releaseFileLock = () => {
    const nextCallback = fileLockQueues.get(path).shift();
    if (nextCallback) {
      nextCallback();
    } else {
      fileLockQueues.delete(path);
    }
  };

  return releaseFileLock;
};

const createAtomicWriteStream = async (path) => {
  const releaseFileLock = await acquireFileLock(path);

  const originalMode = await getOriginalMode(path);

  const tempPath = getTemporaryPath(path);
  const fd = await promisify(fs.open)(tempPath, 'wx', originalMode);
  const writeStream = fs.createWriteStream(null, {
    fd,
    autoClose: false,
    // Increase high water mark from default value of 16384.
    // Increasing this results in less time spent waiting for disk IO to complete, which would pause
    // the sb3 generation stream in scratch-gui.
    // This does negligibly increase possible memory usage.
    highWaterMark: 1024 * 1024
  });

  const cleanAfterError = async () => {
    try {
      await promisify(fs.close)(fd);
    } catch (e) {
      // ignore
    }
    try {
      await promisify(fs.unlink)(tempPath);
    } catch (e) {
      // ignore
    }
    releaseFileLock();
  };

  let error = null;
  writeStream.on('error', (newError) => {
    if (!error) {
      error = newError;
      console.error(error);
      cleanAfterError();
    }
  });

  const write = (data) => {
    if (error) {
      throw error;
    }
    return writeStream.write(data);
  };

  const finish = async () => {
    if (error) {
      throw error;
    }
    await promisify(writeStream.end.bind(writeStream))();
    await promisify(fs.fsync)(fd);
    await promisify(fs.close)(fd);
    await promisify(fs.rename)(tempPath, path);
    releaseFileLock();
  };

  const drain = () => new Promise((resolve, reject) => {
    if (error) {
      return reject(error);
    }
    writeStream.once('drain', () => {
      resolve();
    });
  });

  return {
    write,
    drain,
    finish
  };
};

const writeFileAtomic = async (path, data) => {
  const stream = await createAtomicWriteStream(path);
  stream.write(data);
  return stream.finish();
};

export {
  createAtomicWriteStream,
  writeFileAtomic
};
