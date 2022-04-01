import Prompt from './base-prompt';
import {getTranslation} from '../translations';
import styles from './mediadevices-chooser.css';

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

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

const showPrompt = (audioDevices, videoDevices) => new Promise((resolve, reject) => {
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
      audioDeviceId: audioSelector && audioSelector.get(),
      videoDeviceId: videoSelector && videoSelector.get()
    });
  });
});

const constrainByDeviceId = (constraint, deviceId) => {
  // video: true must be converted to video: {} so we can add a constraint
  if (constraint === true) {
    constraint = {};
  }
  constraint.deviceId = deviceId;
  return constraint;
};

navigator.mediaDevices.getUserMedia = async (constraints) => {
  const hasAudio = !!constraints.audio;
  const hasVideo = !!constraints.video;

  const mediaDevices = await navigator.mediaDevices.enumerateDevices();

  const audioDevices = mediaDevices.filter(i => i.kind === 'audioinput');
  const videoDevices = mediaDevices.filter(i => i.kind === 'videoinput');

  const needsPrompt = (hasAudio && audioDevices.length > 1) || (hasVideo && videoDevices.length > 1);

  if (needsPrompt) {
    const {audioDeviceId, videoDeviceId} = await showPrompt(
      hasAudio ? audioDevices : null,
      hasVideo ? videoDevices : null
    );
    if (audioDeviceId) {
      constraints.audio = constrainByDeviceId(constraints.audio, audioDeviceId);
    }
    if (videoDeviceId) {
      constraints.video = constrainByDeviceId(constraints.video, videoDeviceId);
    }
  }

  return originalGetUserMedia(constraints);
};
