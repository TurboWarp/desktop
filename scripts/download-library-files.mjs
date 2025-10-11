import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as pathUtil from 'node:path';
import { brotliCompress, brotliDecompress } from 'node:zlib';
import { computeMD5, computeSHA256, persistentFetch } from './lib.mjs';

/**
 * @typedef AssetMetadata
 * @property {string} src
 * @property {string} md5
 * @property {string} sha256
 */

const outDirectory = pathUtil.join(import.meta.dirname, '../dist-library-files');

/**
 * @param {AssetMetadata[]} remainingAssets List of remaining assets. Modified in-place.
 */
const startDownloading = async (remainingAssets) => {
  while (remainingAssets.length) {
    const asset = remainingAssets.shift();

    const extension = pathUtil.extname(asset.src);
    const assetPath = pathUtil.join(outDirectory, `${asset.md5}${extension}.br`);

    try {
      const compressedData = await fsPromises.readFile(assetPath);
      const decompressedData = await new Promise((resolve, reject) => {
        brotliDecompress(compressedData, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      });

      const actualMD5 = computeMD5(decompressedData);
      const actualSHA256 = computeSHA256(decompressedData);
      if (actualMD5 !== asset.md5) {
        throw new Error(`MD5 mismatch. Expected ${asset.md5} got ${actualMD5}`);
      }
      if (actualSHA256 !== asset.sha256) {
        throw new Error(`SHA256 mismatch. Expected ${asset.sha256} got ${actualSHA256}`);
      }

      console.log(`Already fetched ${asset.src}`);
      continue;
    } catch (e) {
      if (e.code != 'ENOENT') {
        console.error(e);
      }
    }

    console.log(`Fetching ${asset.src}`);
    const response = await persistentFetch(asset.src);
    const data = await response.arrayBuffer();

    const actualMD5 = computeMD5(data);
    const actualSHA256 = computeSHA256(data);
    if (actualMD5 !== asset.md5) {
      throw new Error(`MD5 mismatch. Expected ${asset.md5} got ${actualMD5}`);
    }
    if (actualSHA256 !== asset.sha256) {
      throw new Error(`SHA256 mismatch. Expected ${asset.sha256} got ${actualSHA256}`);
    }

    const compressedData = await new Promise((resolve, reject) => {
      brotliCompress(data, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });

    await fsPromises.writeFile(assetPath, compressedData);
  }
};

const run = async () => {
  const metadataFile = pathUtil.join(import.meta.dirname, 'library-files.json');
  const remainingAssets = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));

  await fsPromises.mkdir(outDirectory, {
    recursive: true
  });

  const concurrentFetches = 20;
  await Promise.all(Array(concurrentFetches).fill().map(i => startDownloading(remainingAssets)));

  console.log('Downloaded all library assets.');
};

run()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
