const fs = require('fs');
const childProcess = require('child_process');
const rimraf = require('rimraf');
const pathUtil = require('path');

const remove = dir => {
  rimraf.sync(dir);
};

const walk = dir => {
  const children = fs.readdirSync(dir);
  const files = [];
  for (const child of children) {
    const path = pathUtil.join(dir, child);
    const stat = fs.statSync(path);
    if (stat.isDirectory()) {
      const childChildren = walk(path);
      for (const childChild of childChildren) {
        files.push(pathUtil.join(child, childChild));
      }
    } else {
      files.push(child);
    }
  }
  return files;
};

const copyFile = (from, to) => {
  const contents = fs.readFileSync(from, 'utf-8');
  fs.writeFileSync(to, contents);
};

const copyDirectory = (from, to) => {
  const files = walk(from);
  for (const file of files) {
    const oldPath = pathUtil.join(from, file);
    const newPath = pathUtil.join(to, file);
    fs.mkdirSync(to, {recursive: true});
    copyFile(oldPath, newPath);
  }
};

remove('ScratchAddons');
remove('addons');
remove('addons-l10n');

childProcess.execSync('git clone --depth=1 https://github.com/GarboMuffin/ScratchAddons -b tw ScratchAddons');

fs.mkdirSync('addons', {recursive: true});
fs.mkdirSync('addons-l10n', {recursive: true});

const addons = require('./addons.json');
for (const addon of addons) {
  copyDirectory(pathUtil.join('ScratchAddons', 'addons', addon), pathUtil.join('addons', addon));
}

const languages = fs.readdirSync(pathUtil.join('ScratchAddons', 'addons-l10n'));
for (const language of languages) {
  const oldDirectory = pathUtil.join('ScratchAddons', 'addons-l10n', language);
  const newDirectory = pathUtil.join('addons-l10n', language);
  if (!fs.statSync(oldDirectory).isDirectory()) {
    continue;
  }
  fs.mkdirSync(newDirectory, {recursive: true});
  for (const addon of addons) {
    const oldFile = pathUtil.join(oldDirectory, `${addon}.json`);
    const newFile = pathUtil.join(newDirectory, `${addon}.json`);
    try {
      copyFile(oldFile, newFile);
    } catch (e) {
      // ignore
    }
  }
}
