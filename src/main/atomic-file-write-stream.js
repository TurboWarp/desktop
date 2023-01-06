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

const createAtomicWriteStream = async (path) => {
  const originalMode = await getOriginalMode(path);

  const tempPath = getTemporaryPath(path);
  const fd = await promisify(fs.open)(tempPath, 'wx', originalMode);
  const writeStream = fs.createWriteStream(null, {
    fd,
    autoClose: false
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
