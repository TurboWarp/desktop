const fs = require('fs');
const path = require('path');
const {app} = require('electron');
const {writeFileAtomic} = require('./atomic-write-stream');

const PATH = path.resolve(app.getPath('userData'), 'tw_config.json');

/**
 * Migrates settings from before v1.9.0.
 * @param {unknown} legacyData
 * @returns {object}
 */
const migrateLegacyData = (legacyData) => {
  const options = {};
  if (typeof legacyData.locale === 'string') {
    options.locale = legacyData.locale;
  }
  if (legacyData.disable_update_checker === true) {
    options.updateChecker = 'never';
  }
  if (legacyData.bypass_cors === true) {
    options.bypassCORS = true;
  }
  if (legacyData.hardware_acceleration === false) {
    options.hardwareAcceleration = false;
  }
  if (legacyData.background_throttling === false) {
    options.backgroundThrottling = false;
  }
  if (typeof legacyData.last_accessed_directory === 'string') {
    options.lastDirectory = legacyData.last_accessed_directory;
  }
  return options;
};

class Settings {
  constructor () {
    try {
      const parsedFile = JSON.parse(fs.readFileSync(PATH, 'utf-8'));
      if (!parsedFile) throw new Error('data is null');

      if (parsedFile.v2) {
        this.data = parsedFile.v2;
      } else {
        this.data = migrateLegacyData(parsedFile);
      }
    } catch (e) {
      // File does not exist or is corrupted
      this.data = {};
    }
  }

  async save () {
    const serialized = {
      v2: this.data
    };
    await writeFileAtomic(PATH, JSON.stringify(serialized, null, 2));
  }

  /**
   * Tracks which manual data migration was most recently have been performed.
   */
  get dataVersion () {
    return this.data.dataVersion || 0;
  }
  set dataVersion (dataVersion) {
    this.data.dataVersion = dataVersion;
  }

  /**
   * Contains the version of the desktop app that was run previously.
   */
  get desktopVersion() {
    return this.data.desktopVersion || '0.0.0';
  }
  set desktopVersion (desktopVersion) {
    this.data.desktopVersion = desktopVersion;
  }

  /**
   * Contains the Electron version used by the version of the desktop app that was run previously.
   */
  get electronVersion() {
    return this.data.electronVersion || '0.0.0';
  }
  set electronVersion(electronVersion) {
    this.data.electronVersion = electronVersion;
  }

  get locale () {
    return this.data.locale || 'en';
  }
  set locale (locale) {
    this.data.locale = locale;
  }

  get updateChecker () {
    return this.data.updateChecker || 'stable';
  }
  set updateChecker (updateChecker) {
    this.data.updateChecker = updateChecker;
  }

  get ignoredUpdate () {
    return this.data.ignoredUpdate || null;
  }
  set ignoredUpdate (ignoredUpdate) {
    this.data.ignoredUpdate = ignoredUpdate;
  }

  get ignoredUpdateUntil () {
    return this.data.ignoredUpdateUntil || 0;
  }
  set ignoredUpdateUntil (ignoredUpdateUntil) {
    this.data.ignoredUpdateUntil = ignoredUpdateUntil;
  }

  get camera () {
    return this.data.camera || null;
  }
  set camera (camera) {
    this.data.camera = camera;
  }

  get microphone () {
    return this.data.microphone || null;
  }
  set microphone (microphone) {
    this.data.microphone = microphone;
  }

  get bypassCORS () {
    return this.data.bypassCORS === true;
  }
  set bypassCORS (bypassCORS) {
    this.data.bypassCORS = bypassCORS;
  }

  get hardwareAcceleration () {
    return this.data.hardwareAcceleration !== false;
  }
  set hardwareAcceleration (hardwareAcceleration) {
    this.data.hardwareAcceleration = hardwareAcceleration;
  }

  get backgroundThrottling () {
    return this.data.backgroundThrottling !== false;
  }
  set backgroundThrottling (backgroundThrottling) {
    this.data.backgroundThrottling = backgroundThrottling;
  }

  get lastDirectory () {
    return this.data.lastDirectory || app.getPath('downloads');
  }
  set lastDirectory (lastDirectory) {
    this.data.lastDirectory = lastDirectory;
  }

  get spellchecker () {
    return this.data.spellchecker !== false;
  }
  set spellchecker (spellchecker) {
    this.data.spellchecker = spellchecker;
  }

  get exitFullscreenOnEscape () {
    return this.data.exitFullscreenOnEscape !== false;
  }
  set exitFullscreenOnEscape(exitFullscreenOnEscape) {
    this.data.exitFullscreenOnEscape = exitFullscreenOnEscape;
  }

  get richPresence () {
    return this.data.richPresence === true;
  }
  set richPresence (richPresence) {
    this.data.richPresence = richPresence;
  }
}

module.exports = new Settings();
