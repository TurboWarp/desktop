const STORAGE_KEY = 'tw:desktop:telemetry';

const readLocal = () => {
  try {
    const result = localStorage.getItem(STORAGE_KEY);
    if (result) {
      const parsed = JSON.parse(result);
      if (typeof parsed === 'boolean') {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const setLocal = value => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    // ignore
  }
};

const isUndecided = () => readLocal() === null;
const isEnabled = () => readLocal() === true;
const setEnabled = v => setLocal(v);

export default {
  isUndecided,
  isEnabled,
  setEnabled
};
