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
 * @param {string} distributionName
 * @param {boolean} enableUpdates
 */
const getConfig = (distributionName, enableUpdates) => {
  const config = JSON.parse(JSON.stringify(packageJSON.build));
  config.extraMetadata = {
    tw_dist: isProduction ? `prod-${distributionName}` : distributionName,
    tw_warn_legacy: isProduction
  };
  if (isProduction && enableUpdates) {
    config.extraMetadata.tw_update = true;
  }
  return config;
};

const getPublish = () => process.env.GH_TOKEN ? ({
  provider: 'github',
  owner: 'TurboWarp',
  repo: 'desktop'
}) : null;

const buildWindows = async () => {
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
    config: getConfig('win-nsis-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: getConfig('win-nsis-ia32', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.arm64),
    config: getConfig('win-nsis-arm64', true),
    publish: getPublish()
  });

  await builder.build({
    targets: Platform.WINDOWS.createTarget('portable', Arch.x64),
    config: getConfig('win-portable-x64', true),
    publish: getPublish()
  });
};

const buildWindowsLegacy = async () => {
  // This is the last release of Electron 22
  const VERSION = '22.3.27';

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

  const x64Dist = await downloadAndExtract({
    version: VERSION,
    platform: 'win32',
    artifactName: 'electron',
    arch: 'x64'
  });
  const ia32Dist = await downloadAndExtract({
    version: VERSION,
    platform: 'win32',
    artifactName: 'electron',
    arch: 'ia32'
  });

  const newNSIS = {
    ...packageJSON.build.nsis,
    artifactName: '${productName} Legacy Setup ${version} ${arch}.${ext}'
  };

  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
    config: {
      ...getConfig('win-legacy-nsis-x64', true),
      nsis: newNSIS,
      electronDist: x64Dist
    },
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: {
      ...getConfig('win-legacy-nsis-ia32', true),
      nsis: newNSIS,
      electronDist: ia32Dist
    },
    publish: getPublish()
  });
};

const buildMicrosoftStore = async () => {
  // Updates are managed by Microsoft Store
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.x64),
    config: getConfig('appx-x64', false)
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.ia32),
    config: getConfig('appx-ia32', false)
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.arm64),
    config: getConfig('appx-arm64', false)
  });
};

const buildMac = async () => {
  // TODO: electron-builder got native notarization support; switch to that at some point
  const afterSign = async (context) => {
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
  };

  await builder.build({
    targets: Platform.MAC.createTarget('dmg', Arch.universal),
    config: {
      ...getConfig('mac', true),
      afterSign
    },
    publish: getPublish()
  });

  console.log('Mac App Store builds still need to be done manually...');
};

const buildDebian = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.x64),
    config: getConfig('linux-deb-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.arm64),
    config: getConfig('linux-deb-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.armv7l),
    config: getConfig('linux-deb-armv7l', true),
    publish: getPublish()
  });
};

const buildTarball = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.x64),
    config: getConfig('linux-tar-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.arm64),
    config: getConfig('linux-tar-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.armv7l),
    config: getConfig('linux-tar-armv7l', true),
    publish: getPublish()
  });
};

const buildAppimage = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.x64),
    config: getConfig('linux-appimage-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.arm64),
    config: getConfig('linux-appimage-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.armv7l),
    config: getConfig('linux-appimage-armv7l', true),
    publish: getPublish()
  });
};

const run = async () => {
  if (process.argv.includes('--windows')) {
    await buildWindows();
  }
  if (process.argv.includes('--windows-legacy')) {
    await buildWindowsLegacy();
  }
  if (process.argv.includes('--microsoft-store')) {
    await buildMicrosoftStore();
  }
  if (process.argv.includes('--mac')) {
    await buildMac();
  }
  if (process.argv.includes('--debian')) {
    await buildDebian();
  }
  if (process.argv.includes('--tarball')) {
    await buildTarball();
  }
  if (process.argv.includes('--appimage')) {
    await buildAppimage();
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
