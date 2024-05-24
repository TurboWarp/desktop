const { Client } = require('discord-rpc');
const settings = require('./settings');

const RPC = new Client({ transport: 'ipc' });
const clientId = '1243360959066800219';

const startTimestamp = new Date();
let details;

async function setActivity(project) {
  if (project) {
    if (project.length < 2) {
      details = project + ' '; // Rich Presence errors if 'details' is a string with less than two characters
    } else {
      details = project;
    }
  }
  if (settings.richPresence) {
    RPC.setActivity({
      details,
      largeImageKey: 'logo',
      largeImageText: 'TurboWarp Desktop',
      startTimestamp,
      instance: false
    });
  }
};

if (settings.richPresence) {
  RPC.on('ready', () => {
    setActivity();
    setInterval(() => {
      setActivity();
    }, 15e3);
  });

  RPC.login({ clientId }).catch(console.error);
}

module.exports = {
  setActivity
};