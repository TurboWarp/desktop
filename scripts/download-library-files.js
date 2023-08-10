const fs = require('fs');
const pathUtil = require('path');
const Limiter = require('async-limiter');
const crypto = require('crypto');
const promisify = require('util').promisify;
const zlib = require('zlib');

const compress = promisify(zlib.brotliCompress);
const writeFile = promisify(fs.writeFile);
const {fetch} = require('./lib');

const libraryFiles = pathUtil.join(__dirname, '..', 'static', 'library-files');
if (!fs.existsSync(libraryFiles)) {
  console.log('Making library files folder');
  fs.mkdirSync(libraryFiles, {
    recursive: true
  });
}

const guiLibraryFolder = pathUtil.join(__dirname, '..', 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries');
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

const md5 = (buffer) => crypto.createHash('md5').update(new Uint8Array(buffer)).digest('hex');

const allCompressedFiles = [];

const downloadAsset = async (asset) => {
  const md5ext = asset.md5ext;
  if (!/^[0-9a-f]+\.[a-z]+$/gi.test(md5ext)) {
    throw new Error(`invalid md5ext: ${md5ext}`);
  }

  const compressedName = `${md5ext}.br`;
  allCompressedFiles.push(compressedName);
  const compressedPath = pathUtil.join(libraryFiles, compressedName);
  if (fs.existsSync(compressedPath)) {
    console.log(`Already downloaded: ${md5ext}`);
    return;
  }

  console.log(`Downloading: ${md5ext}`);
  const response = await fetch(`https://scratch-assets.scratch.org/${md5ext}`);
  const uncompressed = await response.buffer();

  const expectedHash = asset.assetId;
  const hash = md5(uncompressed);
  if (hash !== expectedHash) {
    throw new Error(`${md5ext}: Hash mismatch: expected ${expectedHash} but found ${hash}`);
  }

  const compressed = await compress(uncompressed);
  await writeFile(compressedPath, Buffer.from(compressed));
};

const limiter = new Limiter({
  concurrency: 10
});

const queueDownloadAsset = (asset) => {
  limiter.push((done) => downloadAsset(asset)
    .then(done)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
  );
};

const assets = new Set();

for (const asset of [...costumes, ...backdrops, ...sounds]) {
  assets.add(asset);
}
for (const sprite of sprites) {
  for (const asset of [...sprite.costumes, ...sprite.sounds]) {
    assets.add(asset);
  }
}

for (const asset of assets) {
  queueDownloadAsset(asset);
}

console.time('Download assets');

limiter.onDone(() => {
  for (const file of fs.readdirSync(libraryFiles)) {
    if (!allCompressedFiles.includes(file)) {
      console.warn(`Extraneous: ${file}`);
    }
  }
  console.timeEnd('Download assets');
  process.exit(0);
});
