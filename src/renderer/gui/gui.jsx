import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ipcRenderer} from 'electron';
import fs from 'fs';
import pathUtil from 'path';
import {promisify} from 'util';
import GUI from 'scratch-gui';
import {AppStateHOC, setFileHandle, openLoadingProject, closeLoadingProject, TWThemeHOC} from 'scratch-gui';
import {openTelemetryModal} from 'scratch-gui/src/reducers/modals';
import SettingStore from '../../../node_modules/scratch-gui/src/addons/settings-store';
import {WrappedFileHandle} from './filesystem-api-impl';
import telemetry from './telemetry';
import './prompt-impl';
import styles from './gui.css';

const readFile = promisify(fs.readFile);

const handleStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

ipcRenderer.on('addon-settings-changed', (event, settings) => {
  SettingStore.setStore(settings);
});

const openAbout = () => {
  ipcRenderer.send('open-about');
};

const openSourceCode = () => {
  ipcRenderer.send('open-source-code');
};

let defaultTitle = null;
const handleUpdateProjectTitle = (title) => {
  // The first project title update will always be the default title eg. "Project"
  // This might not work properly if the user changes language.
  if (defaultTitle === null) {
    defaultTitle = title;
  }
  if (title === defaultTitle) {
    document.title = '';
  } else {
    document.title = title;
  }
};

const handleVmInit = (vm) => {
  vm.setCompilerOptions({
    warpTimer: true
  });
};

const getProjectTitle = (file) => {
  const name = pathUtil.basename(file);
  const match = name.match(/^(.*)\.sb[2|3]?$/);
  if (!match) return null;
  return match[1];
};

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.onchange = () => document.body.setAttribute('theme', darkModeMedia.matches ? 'dark' : 'light');
darkModeMedia.onchange();

const urlSearchParams = new URLSearchParams(location.search);
const fileToOpen = urlSearchParams.get('file');

const DesktopHOC = function (WrappedComponent) {
  let mountedOnce = false;
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        title: null,
        telemetryEnabled: telemetry.isEnabled()
      };
      this.handleClickAddonSettings =this.handleClickAddonSettings.bind(this);
      this.handleTelemetryOptIn =this.handleTelemetryOptIn.bind(this);
      this.handleTelemetryOptOut =this.handleTelemetryOptOut.bind(this);
    }
    componentDidMount () {
      if (mountedOnce) {
        return;
      }
      mountedOnce = true;
      if (fileToOpen !== null) {
        this.props.onLoadingStarted();
        readFile(fileToOpen)
          .then((buffer) => this.props.vm.loadProject(buffer.buffer))
          .then(() => {
            const title = getProjectTitle(fileToOpen);
            if (title) {
              this.setState({
                title
              });
              handleUpdateProjectTitle(title);
            }
            if (fileToOpen.endsWith('.sb3')) {
              this.props.onSetFileHandle(new WrappedFileHandle(fileToOpen));
            }
          })
          .catch((err) => {
            console.error(err);
            alert(`Could not load project file: ${err}`);
          })
          .finally(() => {
            this.props.onLoadingFinished();
          });
      }
    }
    handleClickAddonSettings() {
      ipcRenderer.send('open-addon-settings', {
        locale: this.props.locale.split('-')[0]
      });
    }
    handleTelemetryOptIn () {
      telemetry.setEnabled(true);
      this.setState({
        telemetryEnabled: true
      });
    }
    handleTelemetryOptOut () {
      telemetry.setEnabled(false);
      this.setState({
        telemetryEnabled: false
      });
    }
    render() {
      const {
        locale,
        onLoadingStarted,
        onLoadingFinished,
        onSetFileHandle,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          projectTitle={this.state.title}
          onClickAddonSettings={this.handleClickAddonSettings}
          onTelemetryModalOptIn={this.handleTelemetryOptIn}
          onTelemetryModalOptOut={this.handleTelemetryOptOut}        
          isTelemetryEnabled={this.state.telemetryEnabled}
          onClickAbout={[
            {
              title: 'About',
              onClick: openAbout
            },
            {
              title: 'Source Code',
              onClick: openSourceCode
            },
            {
              title: 'Data Settings',
              onClick: this.props.onOpenTelemetryModal
            }
          ]}
          {...props}
        />
      );
    }
  }
  DesktopComponent.propTypes = {
    locale: PropTypes.string,
    onLoadingStarted: PropTypes.func,
    onLoadingFinished: PropTypes.func,
    onSetFileHandle: PropTypes.func,
    vm: PropTypes.shape({
      loadProject: PropTypes.func
    })
  };
  const mapStateToProps = state => ({
    locale: state.locales.locale,
    vm: state.scratchGui.vm
  });
  const mapDispatchToProps = dispatch => ({
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onLoadingFinished: () => dispatch(closeLoadingProject()),
    onOpenTelemetryModal: () => dispatch(openTelemetryModal()),
    onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle))
  });
  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(DesktopComponent);
};

const WrappedGUI = compose(
  AppStateHOC,
  TWThemeHOC,
  DesktopHOC
)(GUI);

const appTarget = require('../app-target');
ReactDOM.render(<WrappedGUI
  projectId={fileToOpen ? '' : '0'}
  canEditTitle
  isScratchDesktop
  canModifyCloudData={false}
  onStorageInit={handleStorageInit}
  onVmInit={handleVmInit}
  onUpdateProjectTitle={handleUpdateProjectTitle}
  showTelemetryModal={telemetry.isUndecided()}
/>, appTarget);
GUI.setAppElement(appTarget);

// Load addons
require('scratch-gui/src/addons/entry');

export default WrappedGUI;
