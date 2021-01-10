import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ipcRenderer, remote} from 'electron';
import fs from 'fs';
import {promisify} from 'util';
import GUI from 'scratch-gui';
import {AppStateHOC, setFileHandle, openLoadingProject, closeLoadingProject} from 'scratch-gui';
import VM from 'scratch-vm';

import AddonLoaderHOC from '../../addons/loader.jsx';
import {WrappedFileHandle} from './filesystem-api-impl';
import './update-checker';
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

const onClickLogo = () => {
  ipcRenderer.send('about');
};

const getFileFromArgv = () => {
  const argv = remote.process.argv.slice();
  // argv in production: ["turbowarp.exe", "..."]
  // argv in dev: ["electron.exe", "--inspect=", "main.js", "..."]
  if (process.env.NODE_ENV !== 'production') {
    argv.shift();
    argv.shift();
    argv.shift();
  } else {
    argv.shift();
  }
  // Ignore arguments
  while (argv.length > 0 && argv[0].startsWith('--')) {
    argv.shift();
  }
  return argv[0] || null;
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
      this.state = {
        title: null
      };
    }
    componentDidMount () {
      const file = getFileFromArgv();
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
            this.props.onSetFileHandle(new WrappedFileHandle(file));
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
    render() {
      const {
        onLoadingStarted,
        onLoadingFinished,
        onSetFileHandle,
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
    vm: PropTypes.instanceOf(VM)
  };
  const mapStateToProps = state => ({
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
  onClickLogo={onClickLogo}
/>, require('../app-target'));
// TODO: showTelemetryModal?

export default WrappedGUI;
