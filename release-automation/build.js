const pathUtil = require('path');
const fs = require('fs');
const builder = require('electron-builder');
const electronNotarize = require('@electron/notarize');
const electronGet = require('@electron/get');
const AdmZip = require('adm-zip');
const packageJSON = require('../package.json');

const {Platform, Arch} = builder;

const isProduction = process.argv.includes('--production');

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

const getPublish = () => process.env.GH_TOKEN ? ({
  provider: 'github',
  owner: 'TurboWarp',
  repo: 'desktop',
  publishAutoUpdate: false
}) : null;

const build = async ({
  platformName, // String that indexes into Platform[...]
  platformType, // Passed as first argument into platform.createTarget(...)
  manageUpdates = false,
  extraConfig = {},
  prepare = (archName) => Promise.resolve({})
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
    console.log(`Building distribution: ${distributionName}`);

    // electron-builder will automatically merge this with the settings in package.json
    const config = {
      extraMetadata: {
        tw_dist: distributionName,
        tw_warn_legacy: isProduction,
        tw_update: isProduction && manageUpdates
      },
      ...extraConfig,
      ...await prepare(archName)
    };

    return builder.build({
      targets: target,
      config,
      publish: manageUpdates ? getPublish() : null
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

const buildWindowsLegacy = async () => {
  // This is the last release of Electron 22, which no longer receives updates.
  const LEGACY_ELECTRON_VERSION = '22.3.27';

  const downloadAndExtract = async ({version, platform, artifactName, arch}) => {
    const name = `${artifactName}-v${version}-${platform}-${arch}`;
    const extractPath = pathUtil.join(__dirname, '.cache', name);

    if (!fs.existsSync(extractPath)) {
      console.log(`Downloading ${name}, this may take a while...`);

      const zipPath = await electronGet.downloadArtifact({
        version,
        platform,
        artifactName,
        arch
      });
      console.log(`Saved to ${zipPath}`);

      // in case the process dies mid way, extract to temporary path and then rename so we have some level of atomicity
      const zip = new AdmZip(zipPath);
      const tempExtractPath = `${extractPath}.temp`;
      zip.extractAllTo(`${extractPath}.temp`, true);
      fs.renameSync(tempExtractPath, extractPath);
      console.log(`Extracted to ${extractPath}`);
    } else {
      console.log(`Already downloaded ${name}`);
    }

    return extractPath;
  };

  return build({
    platformName: 'WINDOWS',
    platformType: 'nsis',
    manageUpdates: true,
    extraConfig: {
      nsis: {
        artifactName: '${productName} Legacy Setup ${version} ${arch}.${ext}'
      }
    },
    prepare: async (archName) => {
      const electronDist = await downloadAndExtract({
        version: LEGACY_ELECTRON_VERSION,
        platform: 'win32',
        artifactName: 'electron',
        arch: archName
      });
      return {
        electronDist
      };
    }
  });
};

const buildWindowsPortable = () => build({
  platformName: 'WINDOWS',
  platformType: 'portable',
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
  manageUpdates: true,
  extraConfig: {
    // TODO: electron-builder got native notarization support; switch to that at some point
    afterSign: async (context) => {
      if (!isProduction) {
        console.log('Not notarizing: not --production');
        return;
      }

      const {electronPlatformName, appOutDir} = context;
      if (electronPlatformName !== 'darwin') {
        console.log('Not notarizing: not macOS');
        return;
      }

      const appleId = process.env.APPLE_ID_USERNAME
      const appleIdPassword = process.env.APPLE_ID_PASSWORD;
      const teamId = process.env.APPLE_TEAM_ID;
      if (!appleId) {
        console.log('Not notarizing: no APPLE_ID_USERNAME');
        return;
      }
      if (!appleIdPassword) {
        console.log('Not notarizing: no APPLE_ID_PASSWORD');
        return;
      }
      if (!teamId) {
        console.log('Not notarizing: no APPLE_TEAM_ID');
        return;
      }

      console.log('Sending app to Apple for notarization, this will take a while...');
      const appId = packageJSON.build.appId;
      const appPath = `${appOutDir}/${context.packager.appInfo.productFilename}.app`;

      return await electronNotarize.notarize({
        tool: 'notarytool',
        appBundleId: appId,
        appPath,
        appleId,
        appleIdPassword,
        teamId
      });
    }
  }
});

const buildDebian = () => build({
  platformName: 'LINUX',
  platformType: 'deb',
  manageUpdates: true
});

const buildTarball = () => build({
  platformName: 'LINUX',
  platformType: 'tar.gz',
  manageUpdates: true
});

const buildAppImage = () => build({
  platformName: 'LINUX',
  platformType: 'appimage',
  manageUpdates: true
});

const run = async () => {
  const options = {
    '--windows': buildWindows,
    '--windows-legacy': buildWindowsLegacy,
    '--windows-portable': buildWindowsPortable,
    '--microsoft-store': buildMicrosoftStore,
    '--mac': buildMac,
    '--debian': buildDebian,
    '--tarball': buildTarball,
    '--appimage': buildAppImage,
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
