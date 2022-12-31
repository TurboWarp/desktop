const fs = require('fs');
const pathUtil = require('path');

const inputRepository = pathUtil.join(__dirname, '..', 'extensions');
const outputFolder = pathUtil.join(__dirname, '..', 'static', 'extensions.turbowarp.org');

if (!fs.existsSync(inputRepository)) {
  throw new Error('TurboWarp/extensions submodule is missing');
}

// Clean build every time.
fs.rmSync(outputFolder, {
  recursive: true,
  force: true
});
fs.mkdirSync(outputFolder, {
  recursive: true
});

const extensionFolder = pathUtil.join(inputRepository, 'extensions');
for (const extensionFileName of fs.readdirSync(extensionFolder)) {
  const oldFile = pathUtil.join(extensionFolder, extensionFileName);
  const newFile = pathUtil.join(outputFolder, extensionFileName);
  console.log(`Copying extension: ${extensionFileName}`);
  fs.copyFileSync(oldFile, newFile);
}
