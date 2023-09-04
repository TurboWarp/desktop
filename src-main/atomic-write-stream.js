const fs = require('fs');
const {promisify} = require('util');

// This file was initially based on:
// https://github.com/npm/write-file-atomic/blob/a37fdc843f4d391cf1cff85c8e69c3d80e05b049/lib/index.js

const getTemporaryPath = (originalPath) => {
  // The temporary file needs to be located on the same physical disk as the actual file,
  // otherwise we won't be able to rename it.
  let random = '';
  for (let i = 0; i < 7; i++) {
    random += Math.floor(Math.random() * 10).toString();
  }
  return `${originalPath}.${random}`;
};

const getOriginalMode = async (path) => {
  try {
    const stat = await promisify(fs.stat)(path);
    return stat.mode;
  } catch (e) {
    // TODO: we do this because write-file-atomic did it but that seems kinda not great??
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

  // Mac App Store sandbox is *very* restrictive so the atomic writing with a
  // temporary file won't work :(
  // Here we still prevent concurrent writes, at least, but not atomic
  const atomicSupported = !process.mas;

  const tempPath = atomicSupported ? getTemporaryPath(path) : path;
  const fd = await promisify(fs.open)(tempPath, 'w', originalMode);
  const writeStream = fs.createWriteStream(null, {
    fd,
    autoClose: false,
    // Increase high water mark from default value of 16384.
    // Increasing this results in less time spent waiting for disk IO to complete, which would pause
    // the sb3 generation stream in scratch-gui. Increasing this does increase memory usage.
    highWaterMark: 1024 * 1024 * 5
  });

  writeStream.on('error', async (error) => {
    try {
      await promisify(fs.close)(fd);
    } catch (e) {
      // ignore; file might already be closed
    }

    if (atomicSupported) {
      try {
        // TODO: it might make sense to leave the broken file on the disk so that there is a chance
        // of recovery?
        await promisify(fs.unlink)(tempPath);
      } catch (e) {
        // ignore; file might have been removed already
      }
    }

    writeStream.emit('atomic-error', error);
    releaseFileLock();
  });

  writeStream.on('finish', async () => {
    try {
      await promisify(fs.fsync)(fd);
      await promisify(fs.close)(fd);

      if (atomicSupported) {
        await promisify(fs.rename)(tempPath, path);
      }

      writeStream.emit('atomic-finish');
      releaseFileLock();
    } catch (error) {
      writeStream.destroy(error);
    }
  });

  return writeStream;
};

const writeFileAtomic = async (path, data) => {
  const stream = await createAtomicWriteStream(path);
  return new Promise((resolve, reject) => {
    stream.write(data);
    stream.on('atomic-finish', resolve);
    stream.on('atomic-error', reject);
    stream.end();
  });
};

module.exports = {
  createAtomicWriteStream,
  writeFileAtomic
};
