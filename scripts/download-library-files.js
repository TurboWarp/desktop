const fs = require('fs');
const pathUtil = require('path');
const Limiter = require('async-limiter');
const https = require('https');
const crypto = require('crypto');
const {fetch} = require('./lib');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

const libraryFiles = pathUtil.join(__dirname, '..', 'library-files');
if (!fs.existsSync(libraryFiles)) {
  console.log('Making library files folder');
  fs.mkdirSync(libraryFiles);
}

const costumesManifest = pathUtil.join(__dirname, '..', 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'costumes.json');
const backdropManifest = pathUtil.join(__dirname, '..', 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'backdrops.json');
const spriteManifest = pathUtil.join(__dirname, '..', 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'sprites.json');
const soundManifest = pathUtil.join(__dirname, '..', 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'sounds.json');
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

const httpsAgent = new https.Agent({
	keepAlive: true
});

const usedFiles = new Set();

const downloadAsset = async (asset) => {
  const md5ext = asset.md5ext;
  if (usedFiles.has(md5ext)) {
    return;
  }
  usedFiles.add(md5ext);
  const path = pathUtil.join(libraryFiles, md5ext);
  if (fs.existsSync(path)) {
    console.log(`Already exists: ${md5ext}`);
    return;
  }

  console.log(`Downloading: ${md5ext}`);
  const response = await fetch(`https://assets.scratch.mit.edu/${md5ext}`, {
    agent: httpsAgent
  });
  const arrayBuffer = await response.buffer();

  const expectedHash = asset.assetId;
  const hash = crypto.createHash('md5').update(new Uint8Array(arrayBuffer)).digest("hex")
  if (hash !== expectedHash) {
    throw new Error(`${md5ext}: Hash mismatch: expected ${expectedHash} but found ${hash}`);
  }

  await writeFile(path, Buffer.from(arrayBuffer));
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
    if (!usedFiles.has(file)) {
      console.warn(`Extraneous: ${file}`);
    }
  }
  console.timeEnd('Download assets');
});
