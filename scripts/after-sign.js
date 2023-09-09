// This script is run by electron-builder after signing the macOS app.
// In addition to code signing, Apple requires that we upload the app for notarization.
// Initially based on: https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

const {notarize} = require('@electron/notarize');
const packageJSON = require('../package.json');

exports.default = async (context) => {
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
