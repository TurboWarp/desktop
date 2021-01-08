const React = require('react');
const ScratchGUI = require('scratch-gui');
const { compose } = require('redux');

const AppStateHOC = ScratchGUI.AppStateHOC;
const GUI = ScratchGUI.default;

const onStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

const DesktopHOC = function (WrappedGUI) {
  class DesktopComponent extends React.Component {
    render() {
      return (
        <WrappedGUI
          projectId="0"
          canEditTitle
          isScratchDesktop
          canModifyCloudData={false}
          onStorageInit={onStorageInit}
        />
      );
    }
  }
  return DesktopComponent;
};

const WrappedGUI = compose(
  AppStateHOC,
  DesktopHOC
)(GUI);

module.exports = WrappedGUI;
