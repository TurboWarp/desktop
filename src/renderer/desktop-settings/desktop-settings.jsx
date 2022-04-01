import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import {enumerateDevices, getAudioId, getVideoId, setAudioId, setVideoId} from '../browser-ui-reimplementation/mediadevices-chooser';
import {getTranslation} from '../translations';
import styles from './desktop-settings.css';

const ID_NONE = '';

const MediaDeviceChooser = ({devices, selected, onChange}) => (
  <select
    value={selected}
    onChange={onChange}
  >
    {devices.length ? devices.map(({deviceId, label}) => (
      <option
        key={deviceId}
        value={deviceId}
      >
        {label}
      </option>
    )) : (
      <option
        value={ID_NONE}
        disabled
      >
        {getTranslation('settings.no-devices-detected')}
      </option>
    )}
  </select>
);

class DesktopSettings extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      canUpdateCheckerBeEnabled: ipcRenderer.sendSync('update-checker/can-be-enabled'),
      isUpdateCheckerEnabled: ipcRenderer.sendSync('update-checker/get-is-enabled'),

      loadingMediaDevices: true,
      audioDevices: [],
      selectedAudioDevice: ID_NONE,
      videoDevices: [],
      selectedVideoDevice: ID_NONE,
      mediaDevicesDirty: false,

      isHardwareAccelerationEnabled: ipcRenderer.sendSync('hardware-acceleration/get-is-enabled')
    };

    this.handleChangeUpdateCheckerEnabled = this.handleChangeUpdateCheckerEnabled.bind(this);
    this.handleOpenPrivacyPolicy = this.handleOpenPrivacyPolicy.bind(this);
    this.handleSelectedAudioDeviceChanged = this.handleSelectedAudioDeviceChanged.bind(this);
    this.handleSelectedVideoDeviceChanged = this.handleSelectedVideoDeviceChanged.bind(this);
    this.handleChangeHardwareAccelerationEnabled = this.handleChangeHardwareAccelerationEnabled.bind(this);
    this.handleOpenUserData = this.handleOpenUserData.bind(this);
  }

  componentDidMount () {
    this.updateMediaDevices();
  }

  handleChangeUpdateCheckerEnabled (e) {
    const enabled = e.target.checked;
    ipcRenderer.invoke('update-checker/set-is-enabled', enabled);
    this.setState({
      isUpdateCheckerEnabled: enabled
    });
  }

  handleOpenPrivacyPolicy (e) {
    e.preventDefault();
    ipcRenderer.send('open-privacy-policy');
  }

  updateMediaDevices () {
    this.setState({
      loadingMediaDevices: true
    });
    enumerateDevices()
      .then(({audioDevices, videoDevices}) => {
        this.setState({
          loadingMediaDevices: false,
          audioDevices,
          selectedAudioDevice: getAudioId() || ID_NONE,
          videoDevices,
          selectedVideoDevice: getVideoId() || ID_NONE
        });
      });
  }
  handleSelectedAudioDeviceChanged (e) {
    const id = e.target.value;
    setVideoId(id);
    this.setState({
      selectedAudioDevice: id,
      mediaDevicesDirty: true
    });
  }
  handleSelectedVideoDeviceChanged (e) {
    const id = e.target.value;
    setAudioId(id);
    this.setState({
      selectedVideoDevice: id,
      mediaDevicesDirty: true
    });
  }

  handleChangeHardwareAccelerationEnabled (e) {
    const enabled = e.target.checked;
    ipcRenderer.invoke('hardware-acceleration/set-is-enabled', enabled);
    this.setState({
      isHardwareAccelerationEnabled: enabled
    });
  }

  handleOpenUserData () {
    ipcRenderer.send('open-user-data');
  }

  render () {
    return (
      <main>
        <h1>{getTranslation('desktop-settings')}</h1>

        {this.state.canUpdateCheckerBeEnabled && (
          <div className={styles.option}>
            <div className={styles.label}>
              <label>
                <input
                  type="checkbox"
                  onChange={this.handleChangeUpdateCheckerEnabled}
                  disabled={!this.state.canUpdateCheckerBeEnabled}
                  checked={this.state.isUpdateCheckerEnabled}
                />
                {getTranslation('settings.enable-update-checker')}
              </label>
              {' '}
              <a
                onClick={this.handleOpenPrivacyPolicy}
                href="#"
              >
                {getTranslation('settings.privacy-link')}
              </a>
            </div>
            {!this.state.isUpdateCheckerEnabled && (
              <div className={styles.warning}>
                {getTranslation('settings.disabled-update-checker')}
              </div>
            )}
          </div>
        )}

        {this.loadingMediaDevices ? (
          <div className={styles.option}>
            {getTranslation('settings.loading-devices')}
          </div>
        ) : (
          <React.Fragment>
            <label className={styles.option}>
            {getTranslation('settings.microphone')}
              <MediaDeviceChooser
                devices={this.state.audioDevices}
                selected={this.state.selectedAudioDevice}
                onChange={this.handleSelectedAudioDeviceChanged}
              />
            </label>
            <label className={styles.option}>
              {getTranslation('settings.camera')}
              <MediaDeviceChooser
                devices={this.state.videoDevices}
                selected={this.state.selectedVideoDevice}
                onChange={this.handleSelectedVideoDeviceChanged}
              />
            </label>
            {this.state.mediaDevicesDirty && (
              <div className={styles.warning}>
                {getTranslation('settings.restart-for-device-change')}
              </div>
            )}
          </React.Fragment>
        )}

        <div className={styles.option}>
          <label className={styles.label}>
            <input
              type="checkbox"
              checked={this.state.isHardwareAccelerationEnabled}
              onChange={this.handleChangeHardwareAccelerationEnabled}
            />
            {getTranslation('settings.hardware-acceleration')}
          </label>
          {!this.state.isHardwareAccelerationEnabled && (
            <div className={styles.warning}>
              {getTranslation('settings.disabled-hardware-acceleration')}
            </div>
          )}
        </div>

        <div className={styles.option}>
          <button onClick={this.handleOpenUserData}>
            {getTranslation('settings.open-user-data')}
          </button>
        </div>
      </main>
    );
  }
}

ReactDOM.render(<DesktopSettings />, require('../app-target'));
