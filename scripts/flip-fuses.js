const {flipFuses, getCurrentFuseWire, FuseVersion, FuseV1Options} = require('@electron/fuses');

const flip = async (newFuses) => {
  const electronPath = require('electron');

  // Avoid unnecessarily reading and writing the entire Electron binary when
  // we don't need to.
  let stateMismatch = false;
  const currentFuseState = await getCurrentFuseWire(electronPath);
  for (const [key, enabled] of Object.entries(newFuses)) {
    // Electron stores ASCII 1 for enabled, 0 for disabled
    const expectedState = enabled ? 0x31 : 0x30;
    if (currentFuseState[key] !== expectedState) {
      stateMismatch = true;
      break;
    }
  }

  if (stateMismatch) {
    console.log('Writing new Electron fuses...');
    await flipFuses(electronPath, {
      version: FuseVersion.V1,
      ...newFuses
    });
  }
};

const apply = async (isDevelopment) => {
  await flip({
    [FuseV1Options.OnlyLoadAppFromAsar]: !isDevelopment,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: !isDevelopment,
    [FuseV1Options.RunAsNode]: isDevelopment,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: isDevelopment,
    [FuseV1Options.EnableNodeCliInspectArguments]: isDevelopment,
  });
};

const applyDevelopment = () => apply(true);

const applyProduction = () => apply(false);

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
