import * as fs from 'node:fs';
import * as pathUtil from 'node:path';
import * as childProcess from 'node:child_process';
import * as builder from 'electron-builder';
import * as electronFuses from '@electron/fuses';
import './patch-electron-builder.cjs';

const {Platform, Arch} = builder;

const isProduction = process.argv.includes('--production');

// Electron 22 is the last version to support Windows 7, 8, 8.1
const ELECTRON_22_FINAL = '22.3.27';

// Electron 26 is the last version to support macOS 10.13, 10.14
const ELECTRON_26_FINAL = '26.6.10';

// Electron 32 is the last version to support macOS 10.15
const ELECTRON_32_FINAL = '32.3.3';

// Electron 37 is the last version to support macOS 11
// TODO: 37 is still being updates, we should keep bumping this
const ELECTRON_37_FINAL = '37.7.0';

/**
 * @returns {Date}
 */
const getSourceDateEpoch = () => {
  // Used if a better date cannot be obtained for any reason.
  // This is from commit 35045e7c0fa4e4e14b2747e967adb4029cedb945.
  const ARBITRARY_FALLBACK = 1609809111000;

  // If SOURCE_DATE_EPOCH is set externally, use it.
  if (process.env.SOURCE_DATE_EPOCH) {
    return new Date((+process.env.SOURCE_DATE_EPOCH) * 1000);
  }

  // Otherwise, try to get the time of the most recent commit.
  const gitProcess = childProcess.spawnSync('git', ['log', '-1', '--pretty=%ct']);

  if (gitProcess.error) {
    if (gitProcess.error === 'ENOENT') {
      console.warn('Could not get source date epoch: git is not installed');
      return new Date(ARBITRARY_FALLBACK);
    }
    throw gitProcess.error;
  }

  if (gitProcess.status !== 0) {
    console.warn(`Could not get source date epoch: git returned status ${gitProcess.status}`);
    return new Date(ARBITRARY_FALLBACK);
  }

  const gitStdout = gitProcess.stdout.toString().trim();
  if (/^\d+$/.test(gitStdout)) {
    return new Date((+gitStdout) * 1000);
  }

  console.warn(`Could not get source date epoch: git did not return a date`);
  return new Date(ARBITRARY_FALLBACK);
};

const sourceDateEpoch = getSourceDateEpoch();
// Ensure that we have a SOURCE_DATE_EPOCH environment variable so that it is available
// to child processes of electron-builder. This is necessary for making the Debian
// packages producibile.
process.env.SOURCE_DATE_EPOCH = Math.round(sourceDateEpoch.getTime() / 1000).toString();
console.log(`Source date epoch: ${sourceDateEpoch.toISOString()} (${process.env.SOURCE_DATE_EPOCH})`);

/**
 * @param {string} platformName
 * @returns {string} a string that indexes into Arch[...]
 */
const getDefaultArch = (platformName) => {
  if (platformName === 'WINDOWS') return 'x64';
  if (platformName === 'MAC') return 'universal';
  if (platformName === 'LINUX') return 'x64';
  throw new Error(`Unknown platform: ${platformName}`);
};

/**
 * @param {string} platformName
 * @returns {string[]} a string that indexes into Arch[...] or null if the default should be used
 */
const getArchesToBuild = (platformName) => {
  const arches = [];
  for (const arg of process.argv) {
    if (arg === '--x64') arches.push('x64');
    if (arg === '--ia32') arches.push('ia32');
    if (arg === '--armv7l') arches.push('armv7l');
    if (arg === '--arm64') arches.push('arm64');
    if (arg === '--universal') arches.push('universal');
  }
  if (arches.length === 0) {
    arches.push(getDefaultArch(platformName));
  }
  return arches;
};

const flipFuses = async (context) => {
  const electronMajorVersion = +context.packager.info.framework.version.split('.')[0];

  /** @type {import('@electron/fuses').FuseV1Config} */
  const newFuses = {
    version: electronFuses.FuseVersion.V1,
    strictlyRequireAllFuses: true,
  };

  // We don't use this option, but we have to set it explicitly due to strictlyRequireAllFuses.
  newFuses[electronFuses.FuseV1Options.LoadBrowserProcessSpecificV8Snapshot] = false;

  // Disable various Node.js features that we do not use
  newFuses[electronFuses.FuseV1Options.RunAsNode] = false;
  newFuses[electronFuses.FuseV1Options.EnableNodeOptionsEnvironmentVariable] = false;
  newFuses[electronFuses.FuseV1Options.EnableNodeCliInspectArguments] = false;

  // Prevent the app from being tricked into accessing files outside of the ASAR
  newFuses[electronFuses.FuseV1Options.OnlyLoadAppFromAsar] = false;

  // We should consider this option after analyzing performance.
  newFuses[electronFuses.FuseV1Options.EnableEmbeddedAsarIntegrityValidation] = false;

  // We should consider this option after analyzing performance and ensuring that data can't be
  // accidentally lost very easily.
  newFuses[electronFuses.FuseV1Options.EnableCookieEncryption] = false;

  if (electronMajorVersion >= 29) {
    // We should try to disable this in the future but currently it breaks migrate.html.
    newFuses[electronFuses.FuseV1Options.GrantFileProtocolExtraPrivileges] = true;
  }

  await context.packager.addElectronFuses(context, newFuses);
};

/**
 * @param {string} directory
 * @param {Date} date
 */
const recursivelySetFileTimes = (directory, date) => {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const filePath = pathUtil.join(directory, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      recursivelySetFileTimes(filePath, date);
    } else {
      fs.utimesSync(filePath, date, date);
    }
  }
  fs.utimesSync(directory, date, date);
};

const afterPack = async (context) => {
  await flipFuses(context);

  // When electron-builder packs the folder, modification times of the files are
  // preserved for some formats, so ensure that modification times are reproducible.
  recursivelySetFileTimes(context.appOutDir, sourceDateEpoch);
};

const afterPackForUniversalMac = async (context) => {
  // For universal binaries on macOS, we should only need to apply fuses at the end of the build,
  // not on each child build that happens for Intel and ARM.
  // https://github.com/electron-userland/electron-builder/issues/6365#issuecomment-1191747089
  if (context.arch === Arch.universal) {
    await flipFuses(context);
  }

  recursivelySetFileTimes(context.appOutDir, sourceDateEpoch);
};

const afterSign = async (context) => {
  // Ensure that modification times are still reproducible after signing and resource
  // editing.
  recursivelySetFileTimes(context.appOutDir, sourceDateEpoch);
};

const build = async ({
  platformName, // String that indexes into Platform[...]
  platformType, // Passed as first argument into platform.createTarget(...)
  manageUpdates = false,
  legacy = false,
  extraConfig = {}
}) => {
  const buildForArch = async (archName) => {
    if (!Object.prototype.hasOwnProperty.call(Arch, archName)) {
      throw new Error(`Unknown arch: ${archName}`);
    }
    const arch = Arch[archName];

    if (!Object.prototype.hasOwnProperty.call(Platform, platformName)) {
      throw new Error(`Unknown platform: ${platformName}`);
    }
    const platform = Platform[platformName];
    const target = platform.createTarget(platformType, arch);

    let distributionName = `${platformName}-${platformType}-${archName}`.toLowerCase();
    if (isProduction) {
      distributionName = `release-${distributionName}`;
    }
    if (legacy) {
      distributionName = `${distributionName}-legacy`;
    }
    console.log(`Building distribution: ${distributionName}`);

    // electron-builder will automatically merge this with the settings in package.json
    const config = {
      extraMetadata: {
        tw_dist: distributionName,
        tw_warn_legacy: isProduction,
        tw_update: isProduction && manageUpdates
      },
      afterPack: arch === Arch.universal ? afterPackForUniversalMac : afterPack,
      afterSign,
      ...extraConfig
    };

    return builder.build({
      targets: target,
      config,
      // prevent electron-builder from trying to guess where to publish to since
      // we upload them ourselves from the release workflow
      publish: null
    });
  };

  for (const archName of getArchesToBuild(platformName)) {
    await buildForArch(archName);
  }
};

const buildWindows = () => build({
  platformName: 'WINDOWS',
  platformType: 'nsis',
  manageUpdates: true
});

const buildWindowsLegacy = () => build({
  platformName: 'WINDOWS',
  platformType: 'nsis',
  manageUpdates: true,
  legacy: true,
  extraConfig: {
    nsis: {
      artifactName: '${productName}-Legacy-Setup-${version}-${arch}.${ext}'
    },
    electronVersion: ELECTRON_22_FINAL
  }
});

const buildWindowsPortable = () => build({
  platformName: 'WINDOWS',
  platformType: 'portable',
  manageUpdates: true
});

const buildWindowsDir = () => build({
  platformName: 'WINDOWS',
  platformType: 'dir',
  manageUpdates: true
});

const buildMicrosoftStore = () => build({
  platformName: 'WINDOWS',
  platformType: 'appx',
  manageUpdates: false
});

const buildMac = () => build({
  platformName: 'MAC',
  platformType: 'dmg',
  manageUpdates: true
});

const buildMacLegacy10131014 = () => build({
  platformName: 'MAC',
  platformType: 'dmg',
  manageUpdates: true,
  legacy: true,
  extraConfig: {
    mac: {
      artifactName: '${productName}-Legacy-10.13-10.14-Setup-${version}.${ext}'
    },
    electronVersion: ELECTRON_26_FINAL
  }
});

const buildMacLegacy1015 = () => build({
  platformName: 'MAC',
  platformType: 'dmg',
  manageUpdates: true,
  legacy: true,
  extraConfig: {
    mac: {
      artifactName: '${productName}-Legacy-10.15-Setup-${version}.${ext}'
    },
    electronVersion: ELECTRON_32_FINAL
  }
});

const buildMacLegacy11 = () => build({
  platformName: 'MAC',
  platformType: 'dmg',
  manageUpdates: true,
  legacy: true,
  extraConfig: {
    mac: {
      artifactName: '${productName}-Legacy-11-Setup-${version}.${ext}'
    },
    electronVersion: ELECTRON_37_FINAL
  }
});

const buildMacDir = () => build({
  platformName: 'MAC',
  platformType: 'dir',
  manageUpdates: true
});

const buildDebian = () => build({
  platformName: 'LINUX',
  platformType: 'deb',
  manageUpdates: true
});

const buildTarball = () => build({
  platformName: 'LINUX',
  platformType: 'tar.gz',
  manageUpdates: true,
  extraConfig: {
    // gzip header contains various non-deterministic fields that we would like to remove.
    // TODO: would be nice to reimplement this small part of strip-nondeterminism in JS to remove dependency.
    artifactBuildCompleted: async (artifact) => new Promise((resolve, reject) => {
      console.log(`Running strip-nondeterminism on ${artifact.file}`)
      const stripNondeterminism = childProcess.spawn('strip-nondeterminism', [artifact.file]);
      stripNondeterminism.on('error', (e) => {
        if (e.code === 'ENOENT') {
          console.error('strip-nondeterminism is not installed; tarball may not be reproducible.')
          resolve();
        } else {
          reject(e);
        }
      });
      stripNondeterminism.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`strip-nondeterminism exited with status code ${code}`));
        }
      });
    })
  }
});

const buildAppImage = () => build({
  platformName: 'LINUX',
  platformType: 'appimage',
  manageUpdates: true
});

const buildLinuxDir = () => build({
  platformName: 'LINUX',
  platformType: 'dir',
  manageUpdates: true
});

const run = async () => {
  const options = {
    '--windows': buildWindows,
    '--windows-legacy': buildWindowsLegacy,
    '--windows-portable': buildWindowsPortable,
    '--windows-dir': buildWindowsDir,
    '--microsoft-store': buildMicrosoftStore,
    '--mac': buildMac,
    '--mac-legacy-10.13-10.14': buildMacLegacy10131014,
    '--mac-legacy-10.15': buildMacLegacy1015,
    '--mac-legacy-11': buildMacLegacy11,
    '--mac-dir': buildMacDir,
    '--debian': buildDebian,
    '--tarball': buildTarball,
    '--appimage': buildAppImage,
    '--linux-dir': buildLinuxDir
  };

  let built = 0;
  for (const arg of process.argv) {
    if (Object.prototype.hasOwnProperty.call(options, arg)) {
      built++;
      await options[arg]();
    }
  }

  if (built === 0) {
    console.log('Need to specify platforms; see release-automation/README.md');
    process.exit(1);
  }
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
