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
 * @returns {string} a string that indexes into Arch[...]
 */
const getDefaultArch = (platformName) => {
  if (platformName === 'WINDOWS') return 'x64';
  if (platformName === 'MAC') return 'universal';
  if (platformName === 'LINUX') return 'x64';
  throw new Error('unknown platform');
};

/**
 * @returns {string} a string that indexes into Arch[...] or null if the default should be used
 */
const getUserSpecifiedArch = () => {
  if (process.argv.includes('--x64')) return 'x64';
  if (process.argv.includes('--ia32')) return 'ia32';
  if (process.argv.includes('--armv7l')) return 'armv7l';
  if (process.argv.includes('--arm64')) return 'arm64';
  if (process.argv.includes('--universal')) return 'universal';
  return null;
};

const getPublish = () => process.env.GH_TOKEN ? ({
  provider: 'github',
  owner: 'TurboWarp',
  repo: 'desktop',
  publishAutoUpdate: false
}) : null;

/**
 * Recursively copy properties from newValues to resultInPlace, in place.
 * Properties in resultInPlcae but not in newValues are left unchanged.
 * @param {object} resultInPlace
 * @param {object} newValues
 */
const applyExtraProperties = (resultInPlace, newValues) => {
  for (const key of Object.keys(newValues)) {
    if (resultInPlace[key] !== null && typeof resultInPlace[key] === 'object') {
      applyExtraProperties(resultInPlace[key], newValues[key]);
    } else {
      resultInPlace[key] = newValues[key];
    }
  }
};

const build = ({
  platformName, // String that indexes into Platform[...]
  platformType, // Passed as first argument into platform.createTarget(...)
  manageUpdates = false,
  extraConfig = {}
}) => {
  const archName = getUserSpecifiedArch() ?? getDefaultArch(platformName);
  const arch = Arch[archName];
  if (!arch) {
    throw new Error('unknown arch');
  }

  const platform = Platform[platformName];
  if (!platform) {
    throw new Error('unknown platform');
  }
  const target = platform.createTarget(platformType, arch);

  let distributionName = `${platformName}-${platformType}-${archName}`.toLowerCase();
  if (isProduction) {
    distributionName = `release-${distributionName}`;
  }
  console.log(`Building distribution: ${distributionName}`);

  const config = JSON.parse(JSON.stringify(packageJSON.build));
  config.extraMetadata = {
    tw_dist: distributionName,
    tw_warn_legacy: isProduction
  };
  if (isProduction && manageUpdates) {
    config.extraMetadata.tw_update = true;
  }

  applyExtraProperties(config, extraConfig);
  console.log(config);

  return builder.build({
    targets: target,
    config,
    publish: manageUpdates ? getPublish() : null
  });
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

      // in case the process dies mid way, extract to temporary path and then rename so we have some level of atomicity
      const zip = new AdmZip(zipPath);
      const tempExtractPath = `${extractPath}.temp`;
      zip.extractAllTo(`${extractPath}.temp`, true);
      fs.renameSync(tempExtractPath, extractPath);
    } else {
      console.log(`Already downloaded ${name}`);
    }

    return extractPath;
  };

  const electronDist = await downloadAndExtract({
    version: LEGACY_ELECTRON_VERSION,
    platform: 'win32',
    artifactName: 'electron',
    arch: getArch() ?? getDefaultArch('WINDOWS')
  });

  return build({
    platformName: 'WINDOWS',
    platformType: 'nsis',
    manageUpdates: true,
    extraConfig: {
      electronDist,
      nsis: {
        artifactName: '${productName} Legacy Setup ${version} ${arch}.${ext}'
      }
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

const run = () => {
  if (process.argv.includes('--windows')) {
    return buildWindows();
  } else if (process.argv.includes('--windows-legacy')) {
    return buildWindowsLegacy();
  } else if (process.argv.includes('--windows-portable')) {
    return buildWindowsPortable();
  } else if (process.argv.includes('--microsoft-store')) {
    return buildMicrosoftStore();
  } else if (process.argv.includes('--mac')) {
    return buildMac();
  } else if (process.argv.includes('--debian')) {
    return buildDebian();
  } else if (process.argv.includes('--tarball')) {
    return buildTarball();
  } else if (process.argv.includes('--appimage')) {
    return buildAppImage();
  } else {
    console.log('missing platform argument; see release-automation/README.md');
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
