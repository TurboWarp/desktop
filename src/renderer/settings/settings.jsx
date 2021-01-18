import React from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';

import Settings from '../../addons/settings/settings.jsx';
import styles from '../common.css';

const onReloadNow = () => {
  ipcRenderer.send('reload-all');
};

let timeout = null;
const onSettingsChanged = () => {
  if (timeout === null) {
    timeout = setTimeout(() => {
      ipcRenderer.send('addon-settings-changed');
      timeout = null;
    });
  }
};

ReactDOM.render((
  <main>
    <Settings
      onReloadNow={onReloadNow}
      onSettingsChanged={onSettingsChanged}
    />
  </main>
), require('../app-target'));
