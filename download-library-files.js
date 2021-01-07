const fs = require('fs');
const pathUtil = require('path');
const fetch = require('node-fetch');
const Limiter = require('async-limiter');
const https = require('https');
const promisify = require('util').promisify;
const writeFile = promisify(fs.writeFile);

const libraryFiles = pathUtil.join(__dirname, 'library-files');
if (!fs.existsSync(libraryFiles)) {
  console.log('Making library files folder');
  fs.mkdirSync(libraryFiles);
}

const costumesManifest = pathUtil.join(__dirname, 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'costumes.json');
const backdropManifest = pathUtil.join(__dirname, 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'backdrops.json');
const spriteManifest = pathUtil.join(__dirname, 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'sprites.json');
const soundManifest = pathUtil.join(__dirname, 'node_modules', 'scratch-gui', 'src', 'lib', 'libraries', 'sounds.json');
if (!fs.existsSync(costumesManifest)) {
  throw new Error('costumes.json does not exist -- did you forget to `npm install`?');
}
if (!fs.existsSync(backdropManifest)) {
  throw new Error('backdrops.json does not exist -- did you forget to `npm install`?');
}
if (!fs.existsSync(spriteManifest)) {
  throw new Error('sprites.json does not exist -- did you forget to `npm install`?');
}
if (!fs.existsSync(soundManifest)) {
  throw new Error('sounds.json does not exist -- did you forget to `npm install`?');
}

const costumes = JSON.parse(fs.readFileSync(costumesManifest));
const backdrops = JSON.parse(fs.readFileSync(backdropManifest));
const sprites = JSON.parse(fs.readFileSync(spriteManifest));
const sounds = JSON.parse(fs.readFileSync(soundManifest));

const httpsAgent = new https.Agent({
	keepAlive: true
});

const downloadAsset = async (asset) => {
  const md5ext = asset.md5ext;
  const path = pathUtil.join(libraryFiles, md5ext);
  if (fs.existsSync(path)) {
    console.log(`Already exists: ${md5ext}`);
    return;
  }
  console.log(`Downloading: ${md5ext}`);
  const response = await fetch(`https://assets.scratch.mit.edu/${md5ext}`, {
    agent: httpsAgent
  });
  if (response.status !== 200) {
    throw new Error(`Unexpected status code: ${response.status}`);
  }
  const arrayBuffer = await response.buffer();
  await writeFile(path, Buffer.from(arrayBuffer));
};

const limiter = new Limiter({
  concurrency: 5
});

const queueDownloadAsset = (asset) => {
  limiter.push((done) => downloadAsset(asset).then(done).catch(done));
};

for (const asset of [...costumes, ...backdrops, ...sounds]) {
  queueDownloadAsset(asset);
}
for (const sprite of sprites) {
  for (const asset of [...sprite.costumes, ...sprite.sounds]) {
    queueDownloadAsset(asset);
  }
}

limiter.onDone(() => {
  console.log('Done');
});
