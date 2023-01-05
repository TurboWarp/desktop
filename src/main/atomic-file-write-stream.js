import fs from 'fs';
import MurmurHash3 from 'imurmurhash';
import {promisify} from 'util';

// This file was initially based on:
// https://github.com/npm/write-file-atomic/blob/a37fdc843f4d391cf1cff85c8e69c3d80e05b049/lib/index.js

let invocations = 0
const getTemporaryPath = (originalPath) => {
  invocations += 1;
  // The temporary file needs to be located on the same physical disk as the actual file,
  // otherwise we won't be able to rename it.
  return originalPath + '.' + MurmurHash3()
    .hash(__filename)
    .hash(String(process.pid))
    .hash(String(invocations))
    .result();
};

const createAtomicWriteStream = async (path) => {
  // TODO: error handling
  // TODO: preserve mode

  const tempPath = getTemporaryPath(path);
  const fd = await promisify(fs.open)(tempPath, 'w');
  const writeStream = fs.createWriteStream(null, {
    fd,
    autoClose: false
  });

  const write = (data) => writeStream.write(data);

  const finish = async () => {
    await promisify(writeStream.end.bind(writeStream))();
    await promisify(fs.fsync)(fd);
    await promisify(fs.rename)(tempPath, path);
    await promisify(fs.close)(fd);
  };

  const drain = () => new Promise((resolve) => {
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
