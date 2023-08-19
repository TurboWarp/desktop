// const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

// const AUDIO_DEVICE_ID_KEY = 'twd:audio_id';
// const VIDEO_DEVICE_ID_KEY = 'twd:video_id';

// export const setAudioId = (id) => {
//   localStorage.setItem(AUDIO_DEVICE_ID_KEY, id);
// };

// export const setVideoId = (id) => {
//   localStorage.setItem(VIDEO_DEVICE_ID_KEY, id);
// };

// export const probeDevices = async () => {
//   const mediaDevices = await navigator.mediaDevices.enumerateDevices();
//   const audioDevices = mediaDevices.filter(i => i.kind === 'audioinput');
//   const videoDevices = mediaDevices.filter(i => i.kind === 'videoinput');

//   const audioId = localStorage.getItem(AUDIO_DEVICE_ID_KEY);
//   const audioIdExists = audioDevices.find((i) => i.deviceId === audioId);

//   const videoId = localStorage.getItem(VIDEO_DEVICE_ID_KEY);
//   const videoIdExists = videoDevices.filter(i => i.deviceId === videoId);

//   return {
//     audioDevices,
//     videoDevices,
//     audioId: audioIdExists ? audioId : null,
//     videoId: videoIdExists ? videoId : null
//   };
// };

// export const whenDevicesChange = (callback) => {
//   navigator.mediaDevices.addEventListener('devicechange', () => {
//     callback();
//   });
// }

// const constrainByDeviceId = (constraint, deviceId) => {
//   // A constraint like video: true must be converted to video: {} so we can add more constraints
//   if (constraint === true) {
//     constraint = {};
//   }
//   constraint.deviceId = deviceId;
//   return constraint;
// };

// navigator.mediaDevices.getUserMedia = async (constraints) => {
//   const {audio, video} = constraints;
//   const {audioId, videoId} = await probeDevices();
//   if (audio && audioId) {
//     constraints.audio = constrainByDeviceId(audio, audioId);
//   }
//   if (video && videoId) {
//     constraints.video = constrainByDeviceId(video, videoId);
//   }
//   return originalGetUserMedia(constraints);
// };
