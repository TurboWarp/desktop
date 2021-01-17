import React from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';

import Settings from '../../addons/settings/settings.jsx';
import styles from '../common.css';

const onReloadNow = () => {
  ipcRenderer.send('reload-all');
};

const onSettingsChanged = () => {
  ipcRenderer.send('addon-settings-changed');
};

ReactDOM.render((
  <main>
    <Settings
      onReloadNow={onReloadNow}
      onSettingsChanged={onSettingsChanged}
    />
  </main>
), require('../app-target'));
