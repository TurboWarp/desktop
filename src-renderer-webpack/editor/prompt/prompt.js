import styles from './prompt.css';

let strings = {
  ok: 'OK',
  cancel: 'Cancel'
};

const setStrings = (newStrings) => {
  strings = newStrings;
};

const INPUT_ID = 'twd-prompt-input';

let previousPrompt = Promise.resolve();

const _prompt = (message, defaultValue) => new Promise((resolve) => {
  // Can't use <dialog> because CSS variables don't work in ::backdrop in Chrome < 122,
  // but we still support Electron 22 (Chrome 108)
  // https://stackoverflow.com/questions/58818299/css-variables-not-working-in-dialogbackdrop
  // https://issues.chromium.org/issues/40569411

  const interactiveElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'));
  const oldInteractiveElementState = new WeakMap();
  for (const el of interactiveElements) {
    oldInteractiveElementState.set(el, el.tabIndex);
    el.tabIndex = -1;
  }

  const outer = document.createElement('div');
  outer.className = styles.outer;

  const inner = document.createElement('div');
  inner.className = styles.inner;
  outer.appendChild(inner);

  if (message) {
    const label = document.createElement('label');
    label.className = styles.label;
    label.textContent = message;
    label.htmlFor = INPUT_ID;
    inner.appendChild(label);
  }

  const input = document.createElement('input');
  input.id = INPUT_ID;
  input.className = styles.input;
  input.value = defaultValue;
  input.autocomplete = 'off';
  inner.appendChild(input);

  const buttonRow = document.createElement('div');
  buttonRow.className = styles.buttonRow;
  inner.appendChild(buttonRow);

  const cancelButton = document.createElement('button');
  cancelButton.className = styles.cancelButton;
  cancelButton.textContent = strings.cancel;
  buttonRow.append(cancelButton);

  const okButton = document.createElement('button');
  okButton.className = styles.okButton;
  okButton.textContent = strings.ok;
  buttonRow.append(okButton);

  const finish = (value) => {
    for (const el of interactiveElements) {
      el.tabIndex = oldInteractiveElementState.get(el);
    }
    document.removeEventListener('keydown', globalOnKeyDown);
    outer.remove();
    resolve(value);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finish(input.value);
    }
  });

  const globalOnKeyDown = (e) => {
    if (e.key === 'Escape') {
      finish(null);
    }
  };
  document.addEventListener('keydown', globalOnKeyDown);

  outer.addEventListener('click', (e) => {
    if (e.target === outer) {
      finish(null);
    }
  });

  cancelButton.addEventListener('click', () => {
    finish(null);
  });

  okButton.addEventListener('click', () => {
    finish(input.value);
  });

  document.body.appendChild(outer);

  input.focus();
  input.select();
});

window.prompt = async (message = '', defaultValue = '') => {
  previousPrompt = previousPrompt.then(() => _prompt(message, defaultValue));
  return previousPrompt;
};

window.alert = (message) => PromptsPreload.alert(message);

window.confirm = (message) => PromptsPreload.confirm(message);

export {
  setStrings
};
