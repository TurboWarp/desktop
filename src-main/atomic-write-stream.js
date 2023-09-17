const fs = require('fs');
const fsPromises = require('fs/promises');
const nodeCrypto = require('crypto');

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
    const stat = await fsPromises.stat(path);
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

  let released = false;
  const releaseFileLock = () => {
    if (released) {
      return;
    }
    released = true;

    const nextCallback = fileLockQueues.get(path).shift();
    if (nextCallback) {
      nextCallback();
    } else {
      fileLockQueues.delete(path);
    }
  };

  return releaseFileLock;
};

/**
 * @param {string} file path
 * @returns {Promise<string>} hex digest
 */
const sha512 = (file) => new Promise((resolve, reject) => {
  const hash = nodeCrypto.createHash('sha512');
  const stream = fs.createReadStream(file);
  stream.on('data', (data) => {
    hash.update(data);
  });
  stream.on('error', (error) => {
    reject(error);
  });
  stream.on('end', () => {
    resolve(hash.digest('hex'));
  });
});

/**
 * @param {string} a Path 1
 * @param {string} b Path 2
 * @returns {Promise<boolean>} true if the data in the files is identical
 */
const areSameFile = async (a, b) => {
  try {
    const [hashA, hashB] = await Promise.all([
      sha512(a),
      sha512(b)
    ]);
    return hashA === hashB;
  } catch (e) {
    return false;
  }
};

const createAtomicWriteStream = async (path) => {
  const releaseFileLock = await acquireFileLock(path);

  const originalMode = await getOriginalMode(path);

  // Mac App Store sandbox is *very* restrictive so the atomic writing with a
  // temporary file won't work :(
  // Here we still prevent concurrent writes, at least, but not atomic
  const atomicSupported = !process.mas;

  const tempPath = atomicSupported ? getTemporaryPath(path) : path;
  const fileHandle = await fsPromises.open(tempPath, 'w', originalMode);
  const writeStream = fileHandle.createWriteStream({
    autoClose: false,
    // Increase high water mark from default value of 16384.
    // Increasing this results in less time spent waiting for disk IO to complete, which would pause
    // the sb3 generation stream in scratch-gui. Increasing this does increase memory usage.
    highWaterMark: 1024 * 1024 * 5
  });

  const handleError = async (error) => {
    await new Promise((resolve) => {
      writeStream.destroy(null, () => {
        resolve();
      });
    });

    if (atomicSupported) {
      try {
        // TODO: it might make sense to leave the broken file on the disk so that
        // there is a chance of recovery?
        await fsPromises.unlink(tempPath);
      } catch (e) {
        // ignore; file might have been removed already or was never successfully
        // created
      }
    }

    writeStream.emit('atomic-error', error);
    releaseFileLock();
  };

  writeStream.on('error', (error) => {
    handleError(error);
  });

  writeStream.on('finish', async () => {
    try {
      await fileHandle.sync();

      // destroy() will close the file handle
      await new Promise((resolve, reject) => {
        writeStream.destroy(null, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      if (atomicSupported) {
        try {
          await fsPromises.rename(tempPath, path);
        } catch (err) {
          // On Windows, the rename can fail with EPERM even though it succeeded.
          // https://github.com/npm/fs-write-stream-atomic/commit/2f51136f24aaefebd446455a45fa108909b18ca9
          if (
            process.platform === 'win32' &&
            err.syscall === 'rename' &&
            err.code === 'EPERM' &&
            await areSameFile(path, tempPath)
          ) {
            // The rename did actually succeed, so we can remove the temporary file
            await fsPromises.unlink(tempPath);
          } else {
            throw err;
          }
        }
      }

      writeStream.emit('atomic-finish');
      releaseFileLock();
    } catch (error) {
      handleError(error);
    }
  });

  return writeStream;
};

const writeFileAtomic = async (path, data) => {
  try {
    const stream = await createAtomicWriteStream(path);
    await new Promise((resolve, reject) => {
      stream.on('atomic-finish', resolve);
      stream.on('atomic-error', reject);
      stream.write(data);
      stream.end();
    });
  } catch (atomicError) {
    // Try to write it non-atomically. This isn't "safe", but it should improve reliability on some weird systems.
    try {
      await fsPromises.writeFile(path, data);
    } catch (simpleError) {
      throw atomicError;
    }
  }
};

module.exports = {
  createAtomicWriteStream,
  writeFileAtomic
};
