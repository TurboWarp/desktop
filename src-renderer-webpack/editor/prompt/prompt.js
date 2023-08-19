import styles from './prompt.css';

let strings = {
  okay: 'OK',
  cancel: 'Cancel'
};

const setStrings = (newStrings) => {
  strings = newStrings;
};

const INPUT_ID = 'twd-prompt-input';

let previousPrompt = Promise.resolve();

const _prompt = (message, defaultValue) => new Promise((resolve) => {
  const container = document.createElement('dialog');
  container.className = styles.container;

  if (message) {
    const label = document.createElement('label');
    label.className = styles.label;
    label.textContent = message;
    label.htmlFor = INPUT_ID;
    container.appendChild(label);
  }

  const input = document.createElement('input');
  input.id = INPUT_ID;
  input.className = styles.input;
  input.value = defaultValue;
  input.autocomplete = 'off';
  container.appendChild(input);

  const buttonRow = document.createElement('div');
  buttonRow.className = styles.buttonRow;
  container.appendChild(buttonRow);

  const cancelButton = document.createElement('button');
  cancelButton.className = styles.cancelButton;
  cancelButton.textContent = strings.cancel;
  buttonRow.append(cancelButton);

  const okayButton = document.createElement('button');
  okayButton.className = styles.okayButton;
  okayButton.textContent = strings.okay;
  buttonRow.append(okayButton);

  const finish = (value) => {
    document.removeEventListener('keydown', globalOnKeyDown);
    container.remove();
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

  cancelButton.addEventListener('click', () => {
    finish(null);
  });

  okayButton.addEventListener('click', () => {
    finish(input.value);
  });

  document.body.appendChild(container);
  container.showModal();

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
