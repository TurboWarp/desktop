// import {ipcRenderer} from 'electron';
// import React from 'react';
// import ReactDOM from 'react-dom';
// import {probeDevices, setAudioId, setVideoId, whenDevicesChange} from '../browser-ui-reimplementation/mediadevices-chooser';
// import {getTranslation, locale} from '../translations';
// import styles from './desktop-settings.css';

// const ID_NONE = '';

// document.documentElement.lang = locale;

// const MediaDeviceChooser = ({devices, selected, onChange, loading}) => (
//   <select
//     value={loading ? ID_NONE : selected}
//     onChange={onChange}
//     className={styles.deviceChooser}
//   >
//     {loading ? (
//       <option
//         value={ID_NONE}
//         disabled
//       >
//         {getTranslation('settings.loading-devices')}
//       </option>
//     ) : devices.length ? devices.map(({deviceId, label}) => (
//       <option
//         key={deviceId}
//         value={deviceId}
//       >
//         {label}
//       </option>
//     )) : (
//       <option
//         value={ID_NONE}
//         disabled
//       >
//         {getTranslation('settings.no-devices-detected')}
//       </option>
//     )}
//   </select>
// );

// class DesktopSettings extends React.Component {
//   constructor (props) {
//     super(props);
//     this.state = {
//       canUpdateCheckerBeEnabled: ipcRenderer.sendSync('update-checker/can-be-enabled'),
//       isUpdateCheckerEnabled: ipcRenderer.sendSync('update-checker/get-is-enabled'),

//       loadingMediaDevices: true,
//       audioDevices: [],
//       selectedAudioDevice: ID_NONE,
//       videoDevices: [],
//       selectedVideoDevice: ID_NONE,
//       mediaDevicesNeedRestart: false,

//       isHardwareAccelerationEnabled: ipcRenderer.sendSync('hardware-acceleration/get-is-enabled'),
//       isBackgroundThrottlingEnabled: ipcRenderer.sendSync('background-throttling/get-is-enabled'),
//       canBypassCORS: ipcRenderer.sendSync('bypass-cors/get-is-enabled')
//     };

//     this.handleChangeUpdateCheckerEnabled = this.handleChangeUpdateCheckerEnabled.bind(this);
//     this.handleOpenPrivacyPolicy = this.handleOpenPrivacyPolicy.bind(this);
//     this.handleSelectedAudioDeviceChanged = this.handleSelectedAudioDeviceChanged.bind(this);
//     this.handleSelectedVideoDeviceChanged = this.handleSelectedVideoDeviceChanged.bind(this);
//     this.handleChangeHardwareAccelerationEnabled = this.handleChangeHardwareAccelerationEnabled.bind(this);
//     this.handleBackgroundThrottlingChanged = this.handleBackgroundThrottlingChanged.bind(this);
//     this.handleBypassCORSChanged = this.handleBypassCORSChanged.bind(this);
//     this.handleOpenUserData = this.handleOpenUserData.bind(this);
//   }

//   componentDidMount () {
//     this.updateMediaDevices();
//     whenDevicesChange(() => this.updateMediaDevices());
//   }

//   handleChangeUpdateCheckerEnabled (e) {
//     const enabled = e.target.checked;
//     ipcRenderer.invoke('update-checker/set-is-enabled', enabled);
//     this.setState({
//       isUpdateCheckerEnabled: enabled
//     });
//   }

//   handleOpenPrivacyPolicy (e) {
//     e.preventDefault();
//     ipcRenderer.send('open-privacy-policy');
//   }

//   updateMediaDevices () {
//     this.setState({
//       loadingMediaDevices: true
//     });
//     probeDevices()
//       .then(({audioDevices, audioId, videoDevices, videoId}) => {
//         this.setState({
//           loadingMediaDevices: false,
//           audioDevices,
//           selectedAudioDevice: audioId || ID_NONE,
//           videoDevices,
//           selectedVideoDevice: videoId || ID_NONE
//         });
//       });
//   }
//   handleSelectedAudioDeviceChanged (e) {
//     const id = e.target.value;
//     setAudioId(id);
//     this.setState({
//       selectedAudioDevice: id,
//       mediaDevicesNeedRestart: true
//     });
//   }
//   handleSelectedVideoDeviceChanged (e) {
//     const id = e.target.value;
//     setVideoId(id);
//     this.setState({
//       selectedVideoDevice: id,
//       mediaDevicesNeedRestart: true
//     });
//   }

//   handleChangeHardwareAccelerationEnabled (e) {
//     const enabled = e.target.checked;
//     ipcRenderer.invoke('hardware-acceleration/set-is-enabled', enabled);
//     this.setState({
//       isHardwareAccelerationEnabled: enabled
//     });
//   }

//   handleBackgroundThrottlingChanged (e) {
//     const enabled = e.target.checked;
//     ipcRenderer.invoke('background-throttling/set-is-enabled', enabled);
//     this.setState({
//       isBackgroundThrottlingEnabled: enabled
//     });
//   }

//   handleBypassCORSChanged (e) {
//     const enabled = e.target.checked;
//     ipcRenderer.invoke('bypass-cors/set-is-enabled', enabled);
//     this.setState({
//       canBypassCORS: enabled
//     });
//   }

//   handleOpenUserData () {
//     ipcRenderer.send('open-user-data');
//   }

//   render () {
//     return (
//       <main>
//         <h1>{getTranslation('desktop-settings')}</h1>

//         {this.state.canUpdateCheckerBeEnabled && (
//           <div className={styles.option}>
//             <div className={styles.label}>
//               <label>
//                 <input
//                   type="checkbox"
//                   onChange={this.handleChangeUpdateCheckerEnabled}
//                   disabled={!this.state.canUpdateCheckerBeEnabled}
//                   checked={this.state.isUpdateCheckerEnabled}
//                 />
//                 {getTranslation('settings.enable-update-checker')}
//               </label>
//               {' '}
//               <a
//                 onClick={this.handleOpenPrivacyPolicy}
//                 href="#"
//               >
//                 {getTranslation('settings.privacy-link')}
//               </a>
//             </div>
//             {!this.state.isUpdateCheckerEnabled && (
//               <div className={styles.warning}>
//                 {getTranslation('settings.disabled-update-checker')}
//               </div>
//             )}
//           </div>
//         )}

//         <label className={styles.deviceOption}>
//           <div className={styles.deviceLabel}>
//             {getTranslation('settings.microphone')}
//           </div>
//           <MediaDeviceChooser
//             devices={this.state.audioDevices}
//             selected={this.state.selectedAudioDevice}
//             onChange={this.handleSelectedAudioDeviceChanged}
//             loading={this.state.loadingMediaDevices}
//           />
//         </label>
//         <label className={styles.deviceOption}>
//           <div className={styles.deviceLabel}>
//             {getTranslation('settings.camera')}
//           </div>
//           <MediaDeviceChooser
//             devices={this.state.videoDevices}
//             selected={this.state.selectedVideoDevice}
//             onChange={this.handleSelectedVideoDeviceChanged}
//             loading={this.state.loadingMediaDevices}
//           />
//         </label>
//         {this.state.mediaDevicesNeedRestart && (
//           <div className={styles.warning}>
//             {getTranslation('settings.restart-for-device-change')}
//           </div>
//         )}

//         <div className={styles.option}>
//           <label className={styles.label}>
//             <input
//               type="checkbox"
//               checked={this.state.isHardwareAccelerationEnabled}
//               onChange={this.handleChangeHardwareAccelerationEnabled}
//             />
//             {getTranslation('settings.hardware-acceleration')}
//           </label>
//           {!this.state.isHardwareAccelerationEnabled && (
//             <div className={styles.warning}>
//               {getTranslation('settings.disabled-hardware-acceleration')}
//             </div>
//           )}
//         </div>

//         <div className={styles.option}>
//           <label className={styles.label}>
//             <input
//               type="checkbox"
//               checked={this.state.isBackgroundThrottlingEnabled}
//               onChange={this.handleBackgroundThrottlingChanged}
//             />
//             {getTranslation('settings.background-throttling')}
//           </label>
//           {!this.state.isBackgroundThrottlingEnabled && (
//             <div className={styles.warning}>
//               {getTranslation('settings.background-throttling-disabled')}
//             </div>
//           )}
//         </div>

//         <div className={styles.option}>
//           <label className={styles.label}>
//             <input
//               type="checkbox"
//               checked={this.state.canBypassCORS}
//               onChange={this.handleBypassCORSChanged}
//             />
//             {getTranslation('settings.bypass-cors')}
//           </label>
//           {this.state.canBypassCORS && (
//             <div className={styles.warning}>
//               {getTranslation('settings.bypass-cors-enabled')}
//             </div>
//           )}
//         </div>

//         <div className={styles.option}>
//           <button onClick={this.handleOpenUserData}>
//             {getTranslation('settings.open-user-data')}
//           </button>
//         </div>
//       </main>
//     );
//   }
// }

// ReactDOM.render(<DesktopSettings />, require('../app-target'));
