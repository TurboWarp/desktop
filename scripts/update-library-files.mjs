import * as fs from 'node:fs';
import * as pathUtil from 'node:path';
import { computeMD5, computeSHA256, persistentFetch } from './lib.mjs';

/**
 * @typedef AssetMetadata
 * @property {string} src
 * @property {string} md5
 * @property {string} sha256
 */

/**
 * @returns {string[]} Array of md5exts
 */
const getAllMd5exts = () => {
  const guiLibraryFolder = pathUtil.join(import.meta.dirname, '../node_modules/scratch-gui/src/lib/libraries');
  const costumesManifest = pathUtil.join(guiLibraryFolder, 'costumes.json');
  const backdropManifest = pathUtil.join(guiLibraryFolder, 'backdrops.json');
  const spriteManifest = pathUtil.join(guiLibraryFolder, 'sprites.json');
  const soundManifest = pathUtil.join(guiLibraryFolder, 'sounds.json');
  if (!fs.existsSync(costumesManifest)) {
    throw new Error('costumes.json does not exist -- did you forget a step?');
  }
  if (!fs.existsSync(backdropManifest)) {
    throw new Error('backdrops.json does not exist -- did you forget a step?');
  }
  if (!fs.existsSync(spriteManifest)) {
    throw new Error('sprites.json does not exist -- did you forget a step?');
  }
  if (!fs.existsSync(soundManifest)) {
    throw new Error('sounds.json does not exist -- did you forget a step?');
  }

  const costumes = JSON.parse(fs.readFileSync(costumesManifest));
  const backdrops = JSON.parse(fs.readFileSync(backdropManifest));
  const sprites = JSON.parse(fs.readFileSync(spriteManifest));
  const sounds = JSON.parse(fs.readFileSync(soundManifest));

  const result = new Set();
  for (const asset of [...costumes, ...backdrops, ...sounds]) {
    result.add(asset.md5ext);
  }
  for (const sprite of sprites) {
    for (const asset of [...sprite.costumes, ...sprite.sounds]) {
      result.add(asset.md5ext);
    }
  }
  return Array.from(result).sort();
};

/**
 * @param {string[]} remainingAssets List of remaining md5exts. Modified in-place.
 * @returns {Promise<AssetMetadata>} Assets
 */
const startDownloading = async (remainingAssets) => {
  const result = [];
  while (remainingAssets.length) {
    const md5ext = remainingAssets.shift();

    const src = `https://assets.scratch.mit.edu/${md5ext}`;
    console.log(`Fetching ${src}`);

    const response = await persistentFetch(src);
    const data = await response.arrayBuffer();

    const expectedMD5 = md5ext.split('.')[0];
    const actualMD5 = computeMD5(data);
    const actualSHA256 = computeSHA256(data);
    if (actualMD5 !== expectedMD5) {
      throw new Error(`MD5 mismatch. Expected ${expectedMD5} got ${actualMD5}`);
    }

    result.push({
      src: src,
      md5: expectedMD5,
      sha256: actualSHA256
    });
  }

  return result;
};

const run = async () => {
  const remainingAssets = getAllMd5exts();

  const concurrentFetches = 20;
  const assets = (await Promise.all(Array(concurrentFetches).fill().map(i => startDownloading(remainingAssets))));
  const sortedAssets = assets
    .flat()
    .sort((a, b) => a.md5.localeCompare(b.md5));

  const outFile = pathUtil.join(import.meta.dirname, 'library-files.json');
  fs.writeFileSync(outFile, JSON.stringify(sortedAssets, null, 2));

  console.log('Metadata updated. Run `node scripts/download-library-files.js` to finish updating.');
};

run()
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
