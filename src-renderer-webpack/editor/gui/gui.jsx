import React from 'react';
import {compose} from 'redux';
import GUI, {AppStateHOC} from 'scratch-gui';

import DesktopHOC from './desktop-hoc.jsx';
import './normalize.css';
import './gui.css';

const WrappedGUI = compose(
  AppStateHOC,
  DesktopHOC
)(GUI);

const GUIWithProps = () => (
  <WrappedGUI
    isScratchDesktop
    canEditTitle

    // Cloud variables can be created, but not used.
    canModifyCloudData
    canUseCloud
    cloudHost="wss://fake-clouddata-server.turbowarp.org"

    backpackVisible
    backpackHost="_local_"
  />
);

GUIWithProps.setAppElement = GUI.setAppElement;

export default GUIWithProps;
