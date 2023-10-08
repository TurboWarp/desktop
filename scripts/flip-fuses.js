const {flipFuses, FuseVersion, FuseV1Options} = require('@electron/fuses');

const flip = async (fuses) => {
  const electronPath = require('electron');

  await flipFuses(electronPath, {
    version: FuseVersion.V1,
    ...fuses
  });
};

const applyDevelopment = async () => {
  await flip({
    // none
  });
};

const applyProduction = async () => {
  await flip({
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
  });
};

const cli = async () => {
  const argv = process.argv;

  if (argv.includes('--reset') || argv.includes('--development')) {
    await applyDevelopment();
  } else if (argv.includes('--production')) {
    await applyProduction();
  } else {
    console.log('Missing --reset, --development, or --production');
    process.exit(1);
  }
};

if (require.main === module) {
  cli().catch((error) => {
    console.error('Error', error);
    process.exit(1);
  });
} else {
  module.exports = {
    applyDevelopment,
    applyProduction
  };
}
