import React from 'react';
import {compose} from 'redux';
import GUI, {AppStateHOC} from 'scratch-gui';
import TWThemeHOC from 'scratch-gui/src/lib/tw-theme-hoc.jsx';

import DesktopHOC from './desktop-hoc.jsx';
import './gui.css';
import '../browser-prompt-reimplementation.js';

const WrappedGUI = compose(
  AppStateHOC,
  TWThemeHOC,
  DesktopHOC
)(GUI);

const handleClickAddonSettings = () => {
  EditorPreload.openAddonSettings();
};

const handleClickNewWindow = () => {
  EditorPreload.openNewWindow();
};

const handleClickPackager = () => {
  EditorPreload.openPackager();
};

const handleClickDesktopSettings = () => {
  EditorPreload.openDesktopSettings();
};

const handleClickPrivacy = () => {
  EditorPreload.openPrivacy();
};

const handleClickAbout = () => {
  EditorPreload.openAbout();
};

const handleClickSourceCode = () => {
  window.open('https://github.com/TurboWarp');
};

const handleClickDonate = () => {
  window.open('https://github.com/sponsors/GarboMuffin');
};

const GUIWithProps = () => (
  <WrappedGUI
    isScratchDesktop

    canEditTitle

    onClickAddonSettings={handleClickAddonSettings}
    onClickNewWindow={handleClickNewWindow}
    onClickPackager={handleClickPackager}
    onClickAbout={[
      // TODO: translate
      {
        title: 'Desktop Settings',
        onClick: handleClickDesktopSettings
      },
      {
        title: 'Privacy Policy',
        onClick: handleClickPrivacy
      },
      {
        title: 'About',
        onClick: handleClickAbout
      },
      {
        title: 'Source Code',
        onClick: handleClickSourceCode
      },
      {
        title: 'Donate',
        onClick: handleClickDonate
      }
    ]}

    // Cloud variables can be created, but not used.
    canModifyCloudData={true}
    cloudHost="wss://fake-clouddata-server.turbowarp.org"

    backpackVisible
    backpackHost="_local_"
  />
);

GUIWithProps.setAppElement = GUI.setAppElement;

export default GUIWithProps;
