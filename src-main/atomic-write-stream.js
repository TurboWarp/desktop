const fs = require('fs');
const fsPromises = require('fs/promises');
const nodeCrypto = require('crypto');
const pathUtil = require('path');
const {app} = require('electron');
const stream = require('stream');

// This file was initially based on:
// https://github.com/npm/write-file-atomic/blob/a37fdc843f4d391cf1cff85c8e69c3d80e05b049/lib/index.js

/**
 * @param {string} originalPath
 * @param {boolean} mustUseTempDir
 * @returns {string}
 */
const getTemporaryPath = (originalPath, mustUseTempDir) => {
  const randomNumbers = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const randomSuffix = `.tw${randomNumbers}`;

  // Ideally the temporary file and destination file should be located on the
  // same drive and partition.
  if (mustUseTempDir) {
    const tempDir = app.getPath('temp');
    const basename = pathUtil.basename(originalPath);
    return pathUtil.join(tempDir, `${basename}${randomSuffix}`);
  } else {
    return `${originalPath}${randomSuffix}`;
  }
};

const getOriginalMode = async (path) => {
  try {
    const stat = await fsPromises.stat(path);
    return stat.mode;
  } catch (e) {
    // The project should be readable and writable, but not executable.
    // Whatever umask the user has set for our process will override this.
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
 * @param {string} from
 * @param {string} to
 * @returns {Promise<void>} Does not wait for file to be synced to disk
 */
const copy = (from, to) => new Promise((resolve, reject) => {
  // fs.copyFile's error handling does more than we want.
  // On error we want to leave the destination file to allow possible
  // data recovery later.
  const readStream = fs.createReadStream(from);
  const writeStream = fs.createWriteStream(to);
  stream.pipeline(
    readStream,
    writeStream,
    (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }
  );
});

const createAtomicWriteStream = async (path) => {
  const releaseFileLock = await acquireFileLock(path);

  const originalMode = await getOriginalMode(path);

  // Mac App Store sandbox prevents us from saving the temporary file in the
  // same directory as the destination file.
  const isSeverelySandboxed = !!process.mas;

  const runningHash = nodeCrypto.createHash('sha512');
  const tempPath = getTemporaryPath(path, isSeverelySandboxed);

  /** @type {fs.promises.FileHandle} */
  let fileHandle;
  /** @type {fs.WriteStream} */
  let writeStream;
  try {
    fileHandle = await fsPromises.open(tempPath, 'w', originalMode);
    writeStream = fileHandle.createWriteStream({
      autoClose: false,
      // Increase high water mark from default value of 16384.
      // Increasing this results in less time spent waiting for disk IO to complete, which would pause
      // the sb3 generation stream in scratch-gui. Increasing this does increase memory usage.
      highWaterMark: 1024 * 1024 * 5
    });
  } catch (err) {
    if (fileHandle) {
      fileHandle.close();
    }
    releaseFileLock();
    throw err;
  }

  const handleError = async (error) => {
    await new Promise((resolve) => {
      writeStream.destroy(null, () => {
        resolve();
      });
    });

    try {
      // TODO: it might make sense to leave the broken file on the disk so that
      // there is a chance of recovery?
      await fsPromises.unlink(tempPath);
    } catch (e) {
      // ignore; file might have been removed already or was never successfully
      // created
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

      const expectedHash = runningHash.digest('hex');
      try {
        await fsPromises.rename(tempPath, path);

        const finalHash = await sha512(path);
        if (expectedHash !== finalHash) {
          throw new Error('Atomc write stream integrity check failed');
        }
      } catch (err) {
        if (err.syscall === 'rename' && err.code === 'EXDEV') {
          // The temporary file and the destination file were located on separate
          // drives or partitions, so we need to copy instead. This is not ideal
          // and is not atomic, but:
          //  - This is a relatively rare edge case
          //  - Much of the file saving process is still safe to abort at any time
          //    (Pure IO should be faster than zipping the project)
          //  - We still avoid keeping the entire file in memory at once
          await copy(tempPath, path);

          // Per man fsync(2):
          // On some UNIX systems (but not Linux), fd must be a writable file descriptor.
          // Ideally we would only open the destination once, but this works fine.
          const destinationHandle = await fsPromises.open(path, 'a');
          await destinationHandle.sync();
          await destinationHandle.close();

          const finalHash = await sha512(path);
          if (expectedHash !== finalHash) {
            throw new Error('Atomc write stream integrity check failed in EXDEV fallback');
          }

          await fsPromises.unlink(tempPath);
        } else if (process.platform === 'win32' && err.syscall === 'rename' && err.code === 'EPERM') {
          // On Windows, the rename can fail with EPERM even though it succeeded according to
          // https://github.com/npm/fs-write-stream-atomic/commit/2f51136f24aaefebd446455a45fa108909b18ca9

          let finalHash;
          try {
            finalHash = await sha512(path);
          } catch (sha512Error) {
            // If the rename actually failed, the SHA-512 will throw an ENOENT.
            // Re-throw the rename error since that is the original error and will be more meaningful.
            throw err;
          }

          if (expectedHash !== finalHash) {
            // Rename actually failed. Probably the destination file is busy. Throw the original error.
            throw err;
          }

          // Otherwise, the rename actually copied the data over, so just try to remove the temporary
          // file if it still exists.
          try {
            await fsPromises.unlink(tempPath);
          } catch (unlinkError) {
            // ignore
          }
        } else {
          throw err;
        }
      }

      writeStream.emit('atomic-finish');
      releaseFileLock();
    } catch (error) {
      handleError(error);
    }
  });

  const oldWrite = writeStream.write;
  writeStream.write = function (chunk, ...extra) {
    if (extra.length !== 0) {
      throw new Error('Atomic write() only supports one argument');
    }

    runningHash.update(chunk);
    return oldWrite.call(this, chunk);
  };

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
