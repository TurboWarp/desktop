require('./update-checker');
require('./filesystem-api-impl');
require('./prompt-impl');
require('../addons/index');

const React = require('react');
const ReactDOM = require('react-dom');
const ScratchGUI = require('scratch-gui');
const {compose} = require('redux');

const AppStateHOC = ScratchGUI.AppStateHOC;
const GUI = ScratchGUI.default;

const target = document.getElementById('app');
target.style.position = 'absolute';
target.style.top = '0';
target.style.left = '0';
target.style.width = '100%';
target.style.height = '100%';

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.onchange = () => document.body.setAttribute('theme', darkModeMedia.matches ? 'dark' : 'light');
darkModeMedia.onchange();

const onStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

const WrappedGUI = compose(
  AppStateHOC
)(GUI);

ReactDOM.render(React.createElement(WrappedGUI, {
  projectId: '0',
  isPlayerOnly: false,
  canEditTitle: true,
  isScratchDesktop: true,
  canModifyCloudData: false, // just here to remove warnings
  onStorageInit
}, null), target);

document.body.classList.add('tw-loaded');
