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
import {openLoadingProject, closeLoadingProject} from 'scratch-gui/src/reducers/modals';
import {setFileHandle} from 'scratch-gui/src/reducers/tw';
import {defaultProjectId, onFetchedProjectData, onLoadedProject, requestNewProject, requestProjectUpload, setProjectId} from 'scratch-gui/src/reducers/project-state';
import SettingsStore from 'scratch-gui/src/addons/settings-store-singleton';
import AddonChannels from 'scratch-gui/src/addons/channels';
import {WrappedFileHandle} from './filesystem-api-impl';
import {localeChanged, getTranslation} from '../translations';
import runAddons from 'scratch-gui/src/addons/entry';
import './gui.css';

if (!navigator.userAgent.includes('Mac OS')) {
  require('./dark-scrollbars.css');
}

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
  storage.addHelper(new StorageHelper(storage, (asset) => `library-files/${asset}`));
  storage.addHelper(new StorageHelper(storage, (asset) => `https://assets.scratch.mit.edu/internalapi/asset/${asset}/get/`));
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
  ipcRenderer.send('open-source-code');
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

const handleUpdateProjectTitle = (title) => {
  document.title = title;
};

const getProjectTitle = (file) => {
  const match = file.match(/([^/\\]+)\.sb[2|3]?$/);
  if (!match) return null;
  return match[1];
};

const isValidURL = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch (e) {
    return false;
  }
};

const fetchProjectFromURL = (url) => ipcRenderer.invoke('request-url', url);

const readInitialFile = async () => {
  if (isValidURL(fileToOpen)) {
    const match = fileToOpen.match(/^https:\/\/scratch\.mit\.edu\/projects\/(\d+)\/?$/);
    if (match) {
      const id = match[1];
      return fetchProjectFromURL(`https://projects.scratch.mit.edu/${id}`);
    }
    return fetchProjectFromURL(fileToOpen);
  }
  return ipcRenderer.invoke('read-file', fileToOpen);
};

const readBlobAsArrayBuffer = (blob) => new Promise((resolve, reject) => {
  const fr = new FileReader();
  fr.onload = () => resolve(fr.result);
  fr.onerror = () => reject(new Error('Cannot read blob as array buffer'));
  fr.readAsArrayBuffer(blob);
});

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
      this.handleExportProjectOverIPC = this.handleExportProjectOverIPC.bind(this);
      localeChanged(this.props.locale);
    }
    componentDidMount () {
      ipcRenderer.on('export-project/start', this.handleExportProjectOverIPC);

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
        readInitialFile()
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
        } else {
          ipcRenderer.send('set-represented-file', null);
        }
      }
    }
    componentWillUnmount () {
      ipcRenderer.removeListener('export-project/start', this.handleExportProjectOverIPC);
    }
    async handleExportProjectOverIPC (event) {
      ipcRenderer.sendTo(event.senderId, 'export-project/ack');
      try {
        const blob = await this.props.vm.saveProjectSb3();
        const data = await readBlobAsArrayBuffer(blob);
        ipcRenderer.sendTo(event.senderId, 'export-project/done', {
          data,
          name: document.title
        });
      } catch (e) {
        console.error(e);
        ipcRenderer.sendTo(event.senderId, 'export-project/error', '' + e);
      }
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
          onClickNewWindow={openNewWindow}
          onClickAbout={[
            {
              title: getTranslation('packager'),
              onClick: openPackager
            },
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
      saveProjectSb3: PropTypes.func
    })
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
  backpackVisible
  backpackHost="_local_"
  routingStyle="none"
/>, appTarget);

require('./advanced-user-customizations');

runAddons();

export default WrappedGUI;
