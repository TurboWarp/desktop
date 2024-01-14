const builder = require('electron-builder');
const {notarize} = require('@electron/notarize');
const {downloadArtifact} = require('@electron/get');
const packageJSON = require('../package.json');

const {Platform, Arch} = builder;

const getConfig = (distributionName) => ({
  appId: 'org.turbowarp.desktop',
  productName: 'TurboWarp',
  files: [
    'node_modules/**/*',
    'src-main/**/*',
    'src-preload/**/*',
    'src-renderer/**/*',
    'dist-renderer-webpack/**/*',
    'dist-library-files/**/*',
    'dist-extensions/**/*'
  ],
  extraResources: [
    {
      from: 'art/icon.png',
      to: 'icon.png'
    }
  ],
  fileAssociations: [
    {
      ext: 'sb3',
      name: 'Scratch 3 Project',
      role: 'Editor',
      mimeType: 'application/x.scratch.sb3'
    },
    {
      ext: 'sb2',
      name: 'Scratch 2 Project',
      role: 'Editor',
      mimeType: 'application/x.scratch.sb2'
    },
    {
      ext: 'sb',
      name: 'Scratch 1 Project',
      role: 'Editor',
      mimeType: 'application/x.scratch.sb'
    }
  ],
  extraMetadata: {
    tw_update: 'yes',
    tw_dist: distributionName
  },
  win: {
    artifactName: '${productName} Portable ${version} ${arch}.${ext}',
    icon: 'build/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: 'x64'
      },
      {
        target: 'portable',
        arch: 'x64'
      }
    ]
  },
  appx: {
    artifactName: '${productName} MS Store ${version} ${arch}.${ext}',
    applicationId: 'TurboWarp',
    displayName: 'TurboWarp',
    identityName: '45747ThomasWeber.TurboWarpDesktop',
    publisher: 'CN=18FA7D4F-01BF-49F2-BF56-782DCEA49C69',
    publisherDisplayName: 'Thomas Weber',
    backgroundColor: '#4c97ff',
    showNameOnTiles: true,
    languages: [
      'en-US',
      'nl',
      'de',
      'it',
      'ko'
    ]
  },
  nsis: {
    artifactName: '${productName} Setup ${version} ${arch}.${ext}',
    oneClick: false,
    deleteAppDataOnUninstall: true,
    allowToChangeInstallationDirectory: true
  },
  mac: {
    artifactName: '${productName} Setup ${version}.${ext}',
    icon: 'build/icon.icns',
    category: 'public.app-category.education',
    darkModeSupport: true,
    gatekeeperAssess: false,
    hardenedRuntime: true,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    extendInfo: {
      ITSAppUsesNonExemptEncryption: false,
      LSMultipleInstancesProhibited: true,
      NSCameraUsageDescription: 'This app requires camera access when using the video sensing blocks.',
      NSMicrophoneUsageDescription: 'This app requires microphone access when recording sounds or detecting loudness.'
    },
    target: [
      {
        arch: 'universal',
        target: 'dmg'
      }
    ]
  },
  mas: {
    hardenedRuntime: false,
    entitlements: 'build/entitlements.mas.plist',
    entitlementsInherit: 'build/entitlements.mas.inherit.plist',
    provisioningProfile: 'build/distribution.provisionprofile'
  },
  masDev: {
    type: 'development',
    provisioningProfile: 'build/development.provisionprofile'
  },
  linux: {
    artifactName: '${productName}-${os}-${arch}-${version}.${ext}',
    icon: './build/',
    synopsis: 'Mod of Scratch with a compiler and more features.',
    description: 'TurboWarp is a Scratch mod with a compiler to run projects faster, dark mode for your eyes, a bunch of addons to improve the editor, and more.',
    category: 'Development',
    extraFiles: [
      'linux-files'
    ],
    target: [
      {
        target: 'deb'
      },
      {
        target: 'appimage'
      },
      {
        target: 'tar.gz'
      }
    ]
  },
  snap: {
    summary: 'Scratch mod with a compiler, dark mode, a bunch of addons, and more.',
    allowNativeWayland: true,
    plugs: [
      'default',
      'camera',
      'audio-playback',
      'audio-record',
      'joystick',
      'removable-media'
    ]
  },
  appImage: {
    license: null
  },
});

const getPublish = () => process.env.GH_TOKEN ? ({
  provider: 'github',
  owner: 'TurboWarp',
  repo: 'desktop'
}) : null;

const buildWindows = async () => {
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
    config: getConfig('prod-win-nsis-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: getConfig('prod-win-nsis-ia32'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.arm64),
    config: getConfig('prod-win-nsis-arm64'),
    publish: getPublish()
  });

  await builder.build({
    targets: Platform.WINDOWS.createTarget('portable', Arch.x64),
    config: getConfig('prod-win-portable-x64'),
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
    ...getConfig('').nsis,
    artifactName: '${productName} Legacy Setup ${version} ${arch}.${ext}'
  };

  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.x64),
    config: {
      ...getConfig('prod-win-legacy-nsis-x64'),
      ...newNSIS,
      electronDist: x64Dist
    }
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('nsis', Arch.ia32),
    config: {
      ...getConfig('prod-win-legacy-nsis-ia32'),
      ...newNSIS,
      electronDist: ia32Dist
    }
  });
};

const buildMicrosoftStore = async () => {
  // Updates are managed by Microsoft Store
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.x64),
    config: getConfig('prod-appx-x64')
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.ia32),
    config: getConfig('prod-appx-ia32')
  });
  await builder.build({
    targets: Platform.WINDOWS.createTarget('appx', Arch.arm64),
    config: getConfig('prod-appx-arm64')
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
      console.log('Not notarzing: no APPLE_ID_USERNAME');
      return;
    }
    if (!appleIdPassword) {
      console.log('Not notarzing: no APPLE_ID_PASSWORD');
      return;
    }
    if (!teamId) {
      console.log('Not notarzing: no APPLE_TEAM_ID');
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
      ...getConfig('prod-mac'),
      afterSign
    },
    publish: getPublish()
  });

  console.log('Mac App Store builds still need to be done manually...');
};

const buildDebian = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.x64),
    config: getConfig('prod-linux-deb-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.arm64),
    config: getConfig('prod-linux-deb-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('deb', Arch.armv7l),
    config: getConfig('prod-linux-deb-x64'),
    publish: getPublish()
  });
};

const buildTarball = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.x64),
    config: getConfig('prod-linux-tar-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.arm64),
    config: getConfig('prod-linux-tar-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('tar.gz', Arch.armv7l),
    config: getConfig('prod-linux-tar-x64'),
    publish: getPublish()
  });
};

const buildAppimage = async () => {
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.x64),
    config: getConfig('prod-linux-appimage-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.arm64),
    config: getConfig('prod-linux-appimage-x64'),
    publish: getPublish()
  });
  await builder.build({
    targets: Platform.LINUX.createTarget('appimage', Arch.armv7l),
    config: getConfig('prod-linux-appimage-x64'),
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
