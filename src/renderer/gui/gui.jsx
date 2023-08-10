import React from 'react';
import ReactDOM from 'react-dom';
import {compose} from 'redux';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ipcRenderer} from 'electron';
import GUI from 'scratch-gui';
import {AppStateHOC} from 'scratch-gui';
import TWThemeHOC from 'scratch-gui/src/lib/tw-theme-hoc.jsx';
import TWStateManagerHOC from 'scratch-gui/src/lib/tw-state-manager-hoc.jsx';
import TWRestorePointHOC from 'scratch-gui/src/lib/tw-restore-point-hoc.jsx';
import {openLoadingProject, closeLoadingProject} from 'scratch-gui/src/reducers/modals';
import {setFileHandle} from 'scratch-gui/src/reducers/tw';
import {defaultProjectId, onFetchedProjectData, onLoadedProject, requestNewProject, requestProjectUpload, setProjectId} from 'scratch-gui/src/reducers/project-state';
import SettingsStore from 'scratch-gui/src/addons/settings-store-singleton';
import AddonChannels from 'scratch-gui/src/addons/channels';
import {WrappedFileHandle} from './filesystem-api-impl';
import {localeChanged, getTranslation} from '../translations';
import runAddons from 'scratch-gui/src/addons/entry';
import loadInitialProject from './load-initial-project';
import './gui.css';

class StorageHelper {
  constructor (parent, generateURL) {
    this.parent = parent;
    this.generateURL = generateURL;
  }
  load (assetType, assetId, dataFormat) {
    return fetch(this.generateURL(`${assetId}.${dataFormat}`))
      .then((r) => {
        if (!r.ok) {
          throw new Error('Asset does not exist here');
        }
        return r.arrayBuffer();
      })
      .then((data) => new this.parent.Asset(assetType, assetId, dataFormat, new Uint8Array(data)));
  }
}

const handleStorageInit = (storage) => {
  storage.addHelper(new StorageHelper(storage, (asset) => `tw-library-files://library-files/${asset}`));
  storage.addHelper(new StorageHelper(storage, (asset) => `https://scratch-assets.scratch.org/internalapi/asset/${asset}/get/`));
};

AddonChannels.reloadChannel.addEventListener('message', () => {
  location.reload();
});

AddonChannels.changeChannel.addEventListener('message', e => {
  SettingsStore.setStoreWithVersionCheck(e.data);
});

const openAddonSettings = () => {
  ipcRenderer.send('open-addon-settings');
};

const openNewWindow = () => {
  ipcRenderer.send('open-new-window');
};

const openAbout = () => {
  ipcRenderer.send('open-about');
};

const openSourceCode = () => {
  window.open('https://github.com/TurboWarp');
};

const openPrivacyPolicy = () => {
  ipcRenderer.send('open-privacy-policy');
};

const onDesktopSettings = () => {
  ipcRenderer.send('open-desktop-settings');
};

const openPackager = () => {
  ipcRenderer.send('open-packager');
};

const openDonate = () => {
  window.open('https://github.com/sponsors/GarboMuffin');
};

const handleUpdateProjectTitle = (title) => {
  document.title = title;
};

const getProjectTitle = (file) => {
  const match = file.match(/([^/\\]+)\.sb[2|3]?$/);
  if (!match) return null;
  return match[1];
};

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.onchange = () => document.body.setAttribute('theme', darkModeMedia.matches ? 'dark' : 'light');
darkModeMedia.onchange();

const urlSearchParams = new URLSearchParams(location.search);
const fileToOpen = urlSearchParams.get('file');

const storeFilePathInURL = (filePath) => {
  const urlParameters = new URLSearchParams(location.search);
  if (filePath) {
    urlParameters.set('file', filePath);
  } else {
    urlParameters.delete('file');
  }
  history.replaceState('', '', '?' + urlParameters.toString());
};

const DesktopHOC = function (WrappedComponent) {
  let mountedOnce = false;
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        title: null
      };
      this.handleExportProjectOverIPC = this.handleExportProjectOverIPC.bind(this);
      this.handleLoadExtensionOverIPC = this.handleLoadExtensionOverIPC.bind(this);
      localeChanged(this.props.locale);
    }
    componentDidMount () {
      ipcRenderer.on('export-project/start', this.handleExportProjectOverIPC);
      ipcRenderer.on('load-extension/start', this.handleLoadExtensionOverIPC);

      if (mountedOnce) {
        return;
      }
      mountedOnce = true;

      this.props.onLoadingStarted();
      if (fileToOpen === null) {
        this.props.onHasInitialProject(false, this.props.loadingState);
        this.props.onLoadingCompleted();
      } else {
        this.props.onHasInitialProject(true, this.props.loadingState);
        loadInitialProject(fileToOpen)
          .then((projectData) => {
            return this.props.vm.loadProject(projectData)
          })
          .then(() => {
            this.props.onLoadingCompleted();
            this.props.onLoadedProject(this.props.loadingState, true);
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
          .catch(err => {
            console.error(err);
            alert(getTranslation('failed-to-load').replace('{error}', '' + err));
            this.props.onLoadingCompleted();
            this.props.onLoadedProject(this.props.loadingState, false);
            this.props.onHasInitialProject(false, this.props.loadingState);
            this.props.onRequestNewProject();
          });
      }
    }
    componentDidUpdate (prevProps) {
      if (this.props.projectChanged !== prevProps.projectChanged) {
        ipcRenderer.send('set-file-changed', this.props.projectChanged);
      }

      if (this.props.fileHandle !== prevProps.fileHandle) {
        if (this.props.fileHandle) {
          ipcRenderer.send('set-represented-file', this.props.fileHandle.path);
          storeFilePathInURL(this.props.fileHandle.path);
        } else {
          ipcRenderer.send('set-represented-file', null);
          storeFilePathInURL(null);
        }
      }
    }
    componentWillUnmount () {
      ipcRenderer.removeListener('export-project/start', this.handleExportProjectOverIPC);
      ipcRenderer.removeListener('load-extension/start', this.handleLoadExtensionOverIPC);
    }
    async handleExportProjectOverIPC (event) {
      ipcRenderer.sendTo(event.senderId, 'export-project/ack');
      try {
        const arrayBuffer = await this.props.vm.saveProjectSb3('arraybuffer');
        ipcRenderer.sendTo(event.senderId, 'export-project/done', {
          data: arrayBuffer,
          name: document.title
        });
      } catch (e) {
        console.error(e);
        ipcRenderer.sendTo(event.senderId, 'export-project/error', '' + e);
      }
    }
    handleLoadExtensionOverIPC (event, url) {
      this.props.vm.extensionManager.loadExtensionURL(url)
        .then(() => {
          ipcRenderer.sendTo(event.senderId, 'load-extension/done');
        })
        .catch((error) => {
          console.error(error);
          ipcRenderer.sendTo(event.senderId, 'load-extension/error', error);
        });
    }
    render() {
      const {
        fileHandle,
        locale,
        loadingState,
        onFetchedInitialProjectData,
        onHasInitialProject,
        onLoadedProject,
        onLoadingCompleted,
        onLoadingStarted,
        onRequestNewProject,
        onSetFileHandle,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          projectTitle={this.state.title}
          onClickAddonSettings={openAddonSettings}
          onClickNewWindow={[
            getTranslation('menu.new-window'),
            openNewWindow
          ]}
          onClickAbout={[
            {
              title: getTranslation('desktop-settings'),
              onClick: onDesktopSettings
            },
            {
              title: getTranslation('privacy'),
              onClick: openPrivacyPolicy
            },
            {
              title: getTranslation('about'),
              onClick: openAbout
            },
            {
              title: getTranslation('source'),
              onClick: openSourceCode
            },
            {
              title: getTranslation('donate'),
              onClick: openDonate
            }
          ]}
          {...props}
        />
      );
    }
  }
  DesktopComponent.propTypes = {
    fileHandle: PropTypes.instanceOf(WrappedFileHandle),
    locale: PropTypes.string,
    loadingState: PropTypes.string,
    onFetchedInitialProjectData: PropTypes.func,
    onHasInitialProject: PropTypes.func,
    onLoadedProject: PropTypes.func,
    onLoadingCompleted: PropTypes.func,
    onLoadingStarted: PropTypes.func,
    onRequestNewProject: PropTypes.func,
    onSetFileHandle: PropTypes.func,
    projectChanged: PropTypes.bool,
    vm: PropTypes.shape({
      loadProject: PropTypes.func,
      saveProjectSb3: PropTypes.func,
      extensionManager: PropTypes.shape({
        loadExtensionURL: PropTypes.func,
      }),
    }),
  };
  const mapStateToProps = state => ({
    fileHandle: state.scratchGui.tw.fileHandle,
    locale: state.locales.locale,
    loadingState: state.scratchGui.projectState.loadingState,
    projectChanged: state.scratchGui.projectChanged,
    vm: state.scratchGui.vm
  });
  const mapDispatchToProps = dispatch => ({
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onLoadingCompleted: () => dispatch(closeLoadingProject()),
    onHasInitialProject: (hasInitialProject, loadingState) => {
      if (hasInitialProject) {
        return dispatch(requestProjectUpload(loadingState));
      }
      return dispatch(setProjectId(defaultProjectId));
    },
    onFetchedInitialProjectData: (projectData, loadingState) => dispatch(onFetchedProjectData(projectData, loadingState)),
    onLoadedProject: (loadingState, loadSuccess) => {
      return dispatch(onLoadedProject(loadingState, /* canSave */ false, loadSuccess));
    },
    onRequestNewProject: () => dispatch(requestNewProject(false)),
    onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle))
  });
  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(DesktopComponent);
};

const WrappedGUI = compose(
  AppStateHOC,
  TWStateManagerHOC,
  TWThemeHOC,
  TWRestorePointHOC,
  DesktopHOC
)(GUI);

const appTarget = require('../app-target');
GUI.setAppElement(appTarget);
ReactDOM.render(<WrappedGUI
  canEditTitle
  isScratchDesktop
  // Cloud variables can be created, but not used.
  canModifyCloudData={true}
  cloudHost="wss://clouddata.turbowarp.org"
  onStorageInit={handleStorageInit}
  onUpdateProjectTitle={handleUpdateProjectTitle}
  onClickPackager={openPackager}
  backpackVisible
  backpackHost="_local_"
  routingStyle="none"
/>, appTarget);

require('./advanced-user-customizations');

runAddons();

export default WrappedGUI;
