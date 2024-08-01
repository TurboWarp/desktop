import React from 'react';
import {compose} from 'redux';
import GUI, {AppStateHOC} from 'scratch-gui';

import ErrorContainerHOC from '../error/error-container-hoc.jsx';
import DesktopHOC from './desktop-hoc.jsx';
import CloudProviderHOC from './cloud-provider-hoc.jsx';
import {showOpenFilePicker, showSaveFilePicker} from './filesystem-api.js';
import './normalize.css';
import './gui.css';

const WrappedGUI = compose(
  ErrorContainerHOC,
  AppStateHOC,
  DesktopHOC,
  CloudProviderHOC
)(GUI);

const GUIWithProps = () => (
  <WrappedGUI
    isScratchDesktop
    isFullScreen={EditorPreload.isInitiallyFullscreen()}
    canEditTitle

    // Cloud variables can be created, but not used.
    canModifyCloudData
    canUseCloud
    cloudHost="wss://fake-clouddata-server.turbowarp.org"

    backpackVisible
    backpackHost="_local_"

    showOpenFilePicker={showOpenFilePicker}
    showSaveFilePicker={showSaveFilePicker}
  />
);

GUIWithProps.setAppElement = GUI.setAppElement;

export default GUIWithProps;
