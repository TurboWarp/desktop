import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ipcRenderer, remote} from 'electron';
import fs from 'fs';
import pathUtil from 'path';
import {promisify} from 'util';
import GUI from 'scratch-gui';
import {AppStateHOC, setFileHandle, openLoadingProject, closeLoadingProject} from 'scratch-gui';

import AddonLoaderHOC from '../../addons/loader.jsx';
import {WrappedFileHandle} from './filesystem-api-impl';
import './prompt-impl';

const readFile = promisify(fs.readFile);

const onStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

const onLoadAddons = () => {
  require('../../addons/index');
};

const onClickAddonSettings = () => {
  ipcRenderer.send('addon-settings');
};

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

const DesktopHOC = function (WrappedComponent) {
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
      this.state = {
        title: null
      };
    }
    componentDidMount () {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
      const urlSearchParams = new URLSearchParams(location.search);
      const file = urlSearchParams.get("file");
      if (file !== null) {
        this.props.onLoadingStarted();
        readFile(file)
          .then((buffer) => this.props.vm.loadProject(buffer.buffer))
          .then(() => {
            const title = getProjectTitle(file);
            if (title) {
              this.setState({
                title
              });
              onUpdateProjectTitle(title);
            }
            if (file.endsWith('.sb3')) {
              this.props.onSetFileHandle(new WrappedFileHandle(file));
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
    componentWillUnmount () {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
    handleBeforeUnload (e) {
      if (this.props.projectChanged) {
        const choice = remote.dialog.showMessageBoxSync({
          type: 'info',
          buttons: [
            'Stay',
            'Leave'
          ],
          cancelId: 0,
          defaultId: 0,
          message: 'Are you sure you want to quit?',
          detail: 'Any unsaved changes will be lost.'
        });
        if (choice === 0) {
          e.preventDefault();
          e.returnValue = true;
        }
      }
    }
    render() {
      const {
        onLoadingStarted,
        onLoadingFinished,
        onSetFileHandle,
        projectChanged,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          projectTitle={this.state.title}
          {...props}
        />
      );
    }
  }
  DesktopComponent.propTypes = {
    onLoadingStarted: PropTypes.func,
    onLoadingFinished: PropTypes.func,
    onSetFileHandle: PropTypes.func,
    projectChanged: PropTypes.bool,
    vm: PropTypes.shape({
      loadProject: PropTypes.func
    })
  };
  const mapStateToProps = state => ({
    projectChanged: state.scratchGui.projectChanged,
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
  AddonLoaderHOC,
  DesktopHOC
)(GUI);

ReactDOM.render(<WrappedGUI
  projectId="0"
  canEditTitle
  isScratchDesktop
  canModifyCloudData={false}
  onStorageInit={onStorageInit}
  onLoadAddons={onLoadAddons}
  onClickAddonSettings={onClickAddonSettings}
  onClickLogo={onClickLogo}
  onUpdateProjectTitle={onUpdateProjectTitle}
/>, require('../app-target'));
// TODO: showTelemetryModal?

export default WrappedGUI;
