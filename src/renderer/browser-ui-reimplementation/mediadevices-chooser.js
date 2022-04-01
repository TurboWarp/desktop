const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

const AUDIO_DEVICE_ID_KEY = 'twd:audio_id';
const VIDEO_DEVICE_ID_KEY = 'twd:video_id';

export const getAudioId = () => localStorage.getItem(AUDIO_DEVICE_ID_KEY);

export const getVideoId = () => localStorage.getItem(VIDEO_DEVICE_ID_KEY);

export const setAudioId = (id) => {
  localStorage.setItem(AUDIO_DEVICE_ID_KEY, id);
};

export const setVideoId = (id) => {
  localStorage.setItem(VIDEO_DEVICE_ID_KEY, id);
};

export const enumerateDevices = async () => {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  const audioDevices = mediaDevices.filter(i => i.kind === 'audioinput');
  const videoDevices = mediaDevices.filter(i => i.kind === 'videoinput');
  return {
    audioDevices,
    videoDevices
  };
};

const constrainByDeviceId = (constraint, deviceId) => {
  // A constraint like video: true must be converted to video: {} so we can add more constraints
  if (constraint === true) {
    constraint = {};
  }
  constraint.deviceId = deviceId;
  return constraint;
};

navigator.mediaDevices.getUserMedia = (constraints) => {
  const {audio, video} = constraints;
  const audioId = getAudioId();
  const videoId = getVideoId();
  if (audio && audioId) {
    constraints.audio = constrainByDeviceId(audio, audioId);
  }
  if (video && videoId) {
    constraints.video = constrainByDeviceId(video, videoId);
  }
  return originalGetUserMedia(constraints);
};
