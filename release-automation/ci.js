const builder = require('electron-builder');
const {notarize} = require('@electron/notarize');
const {downloadArtifact} = require('@electron/get');
const packageJSON = require('../package.json');

const {Platform, Arch} = builder;

/**
 * @param {string} distributionName
 * @param {boolean} enableUpdates
 */
const getConfig = (distributionName, enableUpdates) => {
  const config = JSON.parse(JSON.stringify(packageJSON.build));
  config.extraMetadata = {
    tw_dist: distributionName
  };
  if (enableUpdates) {
    config.extraMetadata.tw_update = 'yes';
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
    config: getConfig('prod-win-nsis-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: getConfig('prod-win-nsis-ia32', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.arm64),
    config: getConfig('prod-win-nsis-arm64', true),
    publish: getPublish()
  });

  await builder.build({
    targets: Platform.WINDOWS.createTarget('portable', Arch.x64),
    config: getConfig('prod-win-portable-x64', true),
    publish: getPublish()
  });
};

const buildWindowsLegacy = async () => {
  // This is the last release of Electron 22
  const VERSION = '22.3.27';

  console.log('Downloading legacy versions of Electron; might take a bit.');
  const x64Dist = await downloadArtifact({
    version: VERSION,
    platform: 'win32',
    artifactName: 'electron',
    arch: 'x64'
  });
  const ia32Dist = await downloadArtifact({
    version: VERSION,
    platform: 'win32',
    artifactName: 'electron',
    arch: 'ia32'
  });

  const newNSIS = {
    ...packageJSON.build,
    artifactName: '${productName} Legacy Setup ${version} ${arch}.${ext}'
  };

  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
    config: {
      ...getConfig('prod-win-legacy-nsis-x64', true),
      ...newNSIS,
      electronDist: x64Dist
    },
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: {
      ...getConfig('prod-win-legacy-nsis-ia32', true),
      ...newNSIS,
      electronDist: ia32Dist
    },
    publish: getPublish()
  });
};

const buildMicrosoftStore = async () => {
  // Updates are managed by Microsoft Store
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.x64),
    config: getConfig('prod-appx-x64', false)
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.ia32),
    config: getConfig('prod-appx-ia32', false)
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.arm64),
    config: getConfig('prod-appx-arm64', false)
  });
};

const buildMac = async () => {
  const afterSign = async (context) => {
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

    return await notarize({
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
      ...getConfig('prod-mac', true),
      afterSign
    },
    publish: getPublish()
  });

  console.log('Mac App Store builds still need to be done manually...');
};

const buildDebian = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.x64),
    config: getConfig('prod-linux-deb-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.arm64),
    config: getConfig('prod-linux-deb-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.armv7l),
    config: getConfig('prod-linux-deb-armv7l', true),
    publish: getPublish()
  });
};

const buildTarball = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.x64),
    config: getConfig('prod-linux-tar-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.arm64),
    config: getConfig('prod-linux-tar-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.armv7l),
    config: getConfig('prod-linux-tar-armv7l', true),
    publish: getPublish()
  });
};

const buildAppimage = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.x64),
    config: getConfig('prod-linux-appimage-x64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.arm64),
    config: getConfig('prod-linux-appimage-arm64', true),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.armv7l),
    config: getConfig('prod-linux-appimage-armv7l', true),
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
