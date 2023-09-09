const constrain = (originalConstraint, deviceId, allDevices) => {
  const device = allDevices.find((i) => i.deviceId === deviceId);
  if (!device) {
    // The device we're looking for doesn't exist. No reason to constrain it.
    return originalConstraint;
  }

  // A constraint like video: true must be converted to video: {} so we can add more constraints
  if (originalConstraint === true) {
    originalConstraint = {};
  }
  originalConstraint.deviceId = deviceId;
  return originalConstraint;
};

const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

navigator.mediaDevices.getUserMedia = async (constraints) => {
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  const preferredDevices = await EditorPreload.getPreferredMediaDevices();

  if (constraints.audio) {
    constraints.audio = constrain(
      constraints.audio,
      preferredDevices.microphone,
      allDevices.filter((i) => i.kind === 'audioinput')
    );
  }

  if (constraints.video) {
    constraints.video = constrain(
      constraints.video,
      preferredDevices.camera,
      allDevices.filter((i) => i.kind === 'videoinput')
    );
  }

  return originalGetUserMedia(constraints);
};
