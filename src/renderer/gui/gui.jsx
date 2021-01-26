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
import SettingStore from '../../../node_modules/scratch-gui/src/addons/settings-store';

import {WrappedFileHandle} from './filesystem-api-impl';
import './prompt-impl';
import styles from './gui.css';

const readFile = promisify(fs.readFile);

const onStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

const onLoadAddons = () => {
  require('../../../node_modules/scratch-gui/src/addons/entry');
};

ipcRenderer.on('addon-settings-changed', (event, settings) => {
  SettingStore.setStore(settings);
});

const onClickLogo = () => {
  ipcRenderer.send('about');
};

let defaultTitle = null;
const onUpdateProjectTitle = (title) => {
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
        title: null
      };
      this.handleClickAddonSettings =this.handleClickAddonSettings.bind(this);
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
              onUpdateProjectTitle(title);
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
      ipcRenderer.send('addon-settings', {
        locale: this.props.locale.split('-')[0]
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

ReactDOM.render(<WrappedGUI
  projectId={fileToOpen ? '' : '0'}
  canEditTitle
  isScratchDesktop
  canModifyCloudData={false}
  onStorageInit={onStorageInit}
  onLoadAddons={onLoadAddons}
  onClickLogo={onClickLogo}
  onUpdateProjectTitle={onUpdateProjectTitle}
/>, require('../app-target'));
// TODO: showTelemetryModal?

export default WrappedGUI;
