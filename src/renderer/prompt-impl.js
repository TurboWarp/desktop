import {ipcRenderer} from 'electron';
import {getTranslation} from './gui/translations';
import styles from './prompt.css';

const INPUT_ID = 'prompt-impl-input';

let cancelButton;

document.addEventListener('keydown', (e) => {
  if (cancelButton && e.key === 'Escape') {
    cancelButton.click();
  }
});

window.prompt = (message, defaultValue) => new Promise((resolve, reject) => {
  if (cancelButton) {
    cancelButton.click();
  }

  const container = document.createElement('div');
  container.className = styles.container;

  const content = document.createElement('div');
  content.className = styles.content;

  const title = document.createElement('h2');
  title.className = styles.title;

  const titleLabel = document.createElement('label');
  titleLabel.textContent = message;
  titleLabel.htmlFor = INPUT_ID;

  const input = document.createElement('input');
  input.value = defaultValue || '';
  input.className = styles.input;
  input.id = INPUT_ID;
  input.onkeydown = e => {
    if (e.key === 'Enter') {
      okButton.click();
    }
  };

  const buttonContainer = document.createElement('div');
  buttonContainer.className = styles.buttonContainer;

  const okButton = document.createElement('button');
  okButton.className = styles.buttonOk;
  okButton.textContent = getTranslation('prompt.ok');
  okButton.onclick = () => {
    cleanup();
    resolve(input.value);
  };

  cancelButton = document.createElement('button');
  cancelButton.className = styles.buttonCancel;
  cancelButton.textContent = getTranslation('prompt.cancel');
  cancelButton.onclick = () => {
    cleanup();
    resolve(null);
  };

  const cleanup = () => {
    cancelButton = null;
    document.body.removeChild(container);
  };

  title.appendChild(titleLabel);
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(okButton);
  content.appendChild(title);
  content.appendChild(input);
  content.appendChild(buttonContainer);
  container.appendChild(content);
  document.body.appendChild(container);

  input.focus();
  input.select();
});

window.alert = (message) => {
  ipcRenderer.sendSync('alert', message);
};

window.confirm = (message) => {
  return ipcRenderer.sendSync('confirm', message);
};
