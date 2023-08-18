import React from 'react';
import ReactDOM from 'react-dom';
import AddonSettings from 'scratch-gui/src/addons/settings/settings.jsx';
import '../browser-prompt-reimplementation.js';

const handleExportSettings = settings => {
  AddonsPreload.exportSettings(settings);
};

const appTarget = document.getElementById('app');

ReactDOM.render((
  <AddonSettings
    onExportSettings={handleExportSettings}
  />
), appTarget);
