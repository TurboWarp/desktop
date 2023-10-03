const {flipFuses, FuseVersion, FuseV1Options} = require('@electron/fuses');

flipFuses(
  require('electron'),
  {
    version: FuseVersion.V1,
    // Enable additional code integrity features on macOS as our app has camera
    // and microphone entitlements that a malicious app should not have access to.
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true
  }
);
