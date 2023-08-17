import React from 'react';
import ReactDOM from 'react-dom';
import AddonSettings from 'scratch-gui/src/addons/settings/settings.jsx';

const handleExportSettings = settings => {
  AddonsPreload.exportSettings(settings);
};

const appTarget = document.getElementById('app');

ReactDOM.render((
  <AddonSettings
    onExportSettings={handleExportSettings}
  />
), appTarget);
