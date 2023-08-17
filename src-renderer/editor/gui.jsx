import React from 'react';
import {compose} from 'redux';
import GUI, {AppStateHOC} from 'scratch-gui';
import TWThemeHOC from 'scratch-gui/src/lib/tw-theme-hoc.jsx';

import DesktopHOC from './desktop-hoc.jsx';
// import {setFileHandle} from 'scratch-gui/src/reducers/tw';
// import {defaultProwefjectId, onFetchedProjectData, onLoadedProject, requestNewProject, requestProjectUpload, setProjectId} from 'scratch-gui/src/reducers/project-state';
// import SettingsStore from 'scratch-gui/src/addons/settings-store-singleton';
// import AddonChannels from 'scratch-gui/src/addons/channels';
// import {WrappedFileHandle} from './filesystem-api-impl';
// import {localeChanged, getTranslation} from '../translations';
// import runAddons from 'scratch-gui/src/addons/entry';
// import loadInitialProject from './load-initial-project';
import './gui.css';

// class StorageHelper {
//   constructor (parent, generateURL) {
//     this.parent = parent;
//     this.generateURL = generateURL;
//   }
//   load (assetType, assetId, dataFormat) {
//     return fetch(this.generateURL(`${assetId}.${dataFormat}`))
//       .then((r) => {
//         if (!r.ok) {
//           throw new Error('Asset does not exist here');
//         }
//         return r.arrayBuffer();
//       })
//       .then((data) => new this.parent.Asset(assetType, assetId, dataFormat, new Uint8Array(data)));
//   }
// }

// const handleStorageInit = (storage) => {
//   storage.addHelper(new StorageHelper(storage, (asset) => `tw-library-files://library-files/${asset}`));
//   storage.addHelper(new StorageHelper(storage, (asset) => `https://assets.scratch.mit.edu/internalapi/asset/${asset}/get/`));
// };

// AddonChannels.reloadChannel.addEventListener('message', () => {
//   location.reload();
// });

// AddonChannels.changeChannel.addEventListener('message', e => {
//   SettingsStore.setStoreWithVersionCheck(e.data);
// });

// const openAddonSettings = () => {
//   ipcRenderer.send('open-addon-settings');
// };

// const openNewWindow = () => {
//   ipcRenderer.send('open-new-window');
// };

// const openAbout = () => {
//   ipcRenderer.send('open-about');
// };

// const openSourceCode = () => {
//   window.open('https://github.com/TurboWarp');
// };

// const openPrivacyPolicy = () => {
//   ipcRenderer.send('open-privacy-policy');
// };

// const onDesktopSettings = () => {
//   ipcRenderer.send('open-desktop-settings');
// };

// const openPackager = () => {
//   ipcRenderer.send('open-packager');
// };

// const openDonate = () => {
//   window.open('https://github.com/sponsors/GarboMuffin');
// };

// const handleUpdateProjectTitle = (title) => {
//   document.title = title;
// };

// const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
// darkModeMedia.onchange = () => document.body.setAttribute('theme', darkModeMedia.matches ? 'dark' : 'light');
// darkModeMedia.onchange();

// const urlSearchParams = new URLSearchParams(location.search);
// const fileToOpen = urlSearchParams.get('file');

// const storeFilePathInURL = (filePath) => {
//   const urlParameters = new URLSearchParams(location.search);
//   if (filePath) {
//     urlParameters.set('file', filePath);
//   } else {
//     urlParameters.delete('file');
//   }
//   history.replaceState('', '', '?' + urlParameters.toString());
// };

const WrappedGUI = compose(
  AppStateHOC,
  TWThemeHOC,
  DesktopHOC
)(GUI);

const GUIWithProps = () => (
  <WrappedGUI
    canEditTitle
    isScratchDesktop
    
    // Cloud variables can be created, but not used.
    canModifyCloudData={true}
    cloudHost="wss://fake-clouddata-server.turbowarp.org"
    
    // onStorageInit={handleStorageInit}
    // onUpdateProjectTitle={handleUpdateProjectTitle}
    // onClickPackager={openPackager}

    backpackVisible
    backpackHost="_local_"
  />
);

GUIWithProps.setAppElement = GUI.setAppElement;

export default GUIWithProps;
