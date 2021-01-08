import React from 'react';
import {compose} from 'redux';
import GUI from 'scratch-gui';
import {AppStateHOC} from 'scratch-gui';

import AddonLoaderHOC from '../addons/loader.jsx';

const onStorageInit = (storage) => {
  storage.addWebStore(
    [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
    asset => `library-files/${asset.assetId}.${asset.dataFormat}`
  );
};

const DesktopHOC = function (WrappedComponent) {
  class DesktopComponent extends React.Component {
    render() {
      return (
        <WrappedComponent
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
  DesktopHOC,
  AddonLoaderHOC
)(GUI);

export default WrappedGUI;
