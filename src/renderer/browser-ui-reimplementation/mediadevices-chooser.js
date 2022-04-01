import Prompt from './base-prompt';
import {getTranslation} from '../translations';
import styles from './mediadevices-chooser.css';

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

const AUDIO_DEVICE_ID_KEY = 'twd:audio_id';
const VIDEO_DEVICE_ID_KEY = 'twd:video_id';

const makeDeviceSelector = (text, devices) => {
  const root = document.createElement('label');
  root.className = styles.selector;

  const label = document.createElement('span');
  label.textContent = text;
  label.className = styles.label;

  const selector = document.createElement('select');
  for (const device of devices) {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = device.label;
    selector.appendChild(option);
  }
  selector.className = styles.input;
  selector.selectedIndex = 0;

  root.appendChild(label);
  root.appendChild(selector);

  return {
    root,
    get: () => selector.selectedOptions[0].value
  };
};

const showDeviceSelectorPrompt = (audioDevices, videoDevices) => new Promise((resolve) => {
  const prompt = new Prompt();
  prompt.cancellable = false;

  const title = document.createElement('h2');
  title.className = styles.title;
  title.textContent = getTranslation('media-chooser.title');
  prompt.content.appendChild(title);

  prompt.content.appendChild(Object.assign(document.createElement('p'), {
    textContent: getTranslation('media-chooser.help1')
  }));

  const audioSelector = audioDevices && makeDeviceSelector(getTranslation('media-chooser.microphone'), audioDevices);
  if (audioSelector) {
    prompt.content.appendChild(audioSelector.root);
  }
  const videoSelector = videoDevices && makeDeviceSelector(getTranslation('media-chooser.camera'), videoDevices);
  if (videoSelector) {
    prompt.content.appendChild(videoSelector.root);
  }

  prompt.content.appendChild(Object.assign(document.createElement('p'), {
    textContent: getTranslation('media-chooser.help2')
  }));

  prompt.show();

  prompt.addEventListener('ok', () => {
    resolve({
      audioId: audioSelector && audioSelector.get(),
      videoId: videoSelector && videoSelector.get()
    });
  });
});

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

const needsConfiguration = (devices, deviceId) => {
  if (deviceId) {
    for (const device of devices) {
      if (device.deviceId === deviceId) {
        // A device with the given ID exists.
        return false;
      }
    }
    // A device ID is configured but the device does not exist.
    // We'll treat this as having no ID configured at all.
  }
  // Device ID is not configured
  // Even if the device only has 1 microphone, Chromium exposes 2 devices to us, one of which is always "Default"
  return devices.length > 2;
};

const constrainByDeviceId = (constraint, deviceId) => {
  // A constraint like video: true must be converted to video: {} so we can add more constraints
  if (constraint === true) {
    constraint = {};
  }
  constraint.deviceId = deviceId;
  return constraint;
};

navigator.mediaDevices.getUserMedia = async (constraints) => {
  const {audioDevices, videoDevices} = await enumerateDevices();
  const {audio, video} = constraints;
  let audioId = getAudioId();
  let videoId = getVideoId();

  const needsAudioConfiguration = audio && needsConfiguration(audioDevices, audioId);
  const needsVideoConfiguration = video && needsConfiguration(videoDevices, videoId);
  if (needsAudioConfiguration || needsVideoConfiguration) {
    const result = await showDeviceSelectorPrompt(
      audio ? audioDevices : null,
      video ? videoDevices : null
    );
    if (result.audioId) {
      audioId = result.audioId;
      setAudioId(audioId);
    }
    if (result.videoId) {
      videoId = result.videoId;
      setVideoId(videoId);
    }
  }

  if (audio && audioId) {
    constraints.audio = constrainByDeviceId(audio, audioId);
  }
  if (video && videoId) {
    constraints.video = constrainByDeviceId(video, videoId);
  }
  return originalGetUserMedia(constraints);
};
