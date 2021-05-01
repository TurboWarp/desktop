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
import SettingStore from 'scratch-gui/src/addons/settings-store';
import {WrappedFileHandle} from './filesystem-api-impl';
import {localeChanged, getTranslation} from './translations';
import './gui.css';

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

const openPrivacyPolicy = () => {
  ipcRenderer.send('open-privacy-policy');
};

const handleUpdateProjectTitle = (title) => {
  document.title = title;
};

const handleVmInit = (vm) => {
  vm.setCompilerOptions({
    warpTimer: true
  });
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

const DesktopHOC = function (WrappedComponent) {
  let mountedOnce = false;
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        title: null
      };
      this.handleClickAddonSettings = this.handleClickAddonSettings.bind(this);
    }
    componentDidMount () {
      localeChanged(this.props.locale);

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
        ipcRenderer.invoke('read-file', fileToOpen)
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
            alert(getTranslation('tw.desktop.renderer.failedToLoad').replace('{error}', '' + err));
            this.props.onLoadingCompleted();
            this.props.onLoadedProject(this.props.loadingState, false);
            this.props.onHasInitialProject(false, this.props.loadingState);
            this.props.onRequestNewProject();
          });
      }
    }
    handleClickAddonSettings() {
      ipcRenderer.send('open-addon-settings', {
        locale: this.props.locale.split('-')[0]
      });
    }
    render() {
      const {
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
          onClickAddonSettings={this.handleClickAddonSettings}
          onClickAbout={[
            {
              title: getTranslation('tw.desktop.renderer.about.about'),
              onClick: openAbout
            },
            {
              title: getTranslation('tw.desktop.renderer.about.privacy'),
              onClick: openPrivacyPolicy
            },
            {
              title: getTranslation('tw.desktop.renderer.about.source'),
              onClick: openSourceCode
            }
          ]}
          {...props}
        />
      );
    }
  }
  DesktopComponent.propTypes = {
    locale: PropTypes.string,
    loadingState: PropTypes.string,
    onFetchedInitialProjectData: PropTypes.func,
    onHasInitialProject: PropTypes.func,
    onLoadedProject: PropTypes.func,
    onLoadingCompleted: PropTypes.func,
    onLoadingStarted: PropTypes.func,
    onRequestNewProject: PropTypes.func,
    onSetFileHandle: PropTypes.func,
    vm: PropTypes.shape({
      loadProject: PropTypes.func
    })
  };
  const mapStateToProps = state => ({
    locale: state.locales.locale,
    loadingState: state.scratchGui.projectState.loadingState,
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
  canModifyCloudData={false}
  onStorageInit={handleStorageInit}
  onVmInit={handleVmInit}
  onUpdateProjectTitle={handleUpdateProjectTitle}
  backpackVisible
  backpackHost="_local_"
  routingStyle="none"
/>, appTarget);

require('./advanced-user-customizations');

// Load addons
import('scratch-gui/src/addons/entry');

export default WrappedGUI;
