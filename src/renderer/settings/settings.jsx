import React from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';

import Settings from 'scratch-gui/src/addons/settings/settings.jsx';
import SettingsStore from 'scratch-gui/src/addons/settings-store-singleton';

const onReloadNow = () => {
  ipcRenderer.send('reload-all');
};

let timeout = null;
const onSettingsChanged = () => {
  if (timeout === null) {
    timeout = setTimeout(() => {
      ipcRenderer.send('addon-settings-changed', SettingsStore.store);
      timeout = null;
    }, 100);
  }
};

const onExportSettings = settings => {
  ipcRenderer.send('export-addon-settings', settings);
};

ReactDOM.render((
  <Settings
    onReloadNow={onReloadNow}
    onSettingsChanged={onSettingsChanged}
    onExportSettings={onExportSettings}
  />
), require('../app-target'));
