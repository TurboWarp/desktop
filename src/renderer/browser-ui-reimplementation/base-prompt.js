import {getTranslation} from '../translations';
import styles from './base-prompt.css';

let previousPrompt;

document.addEventListener('keydown', (e) => {
  if (previousPrompt && e.key === 'Escape') {
    previousPrompt.cancel();
  }
});

class Prompt extends EventTarget {
  constructor () {
    super();

    this.container = document.createElement('div');
    this.container.className = styles.container;

    this.inner = document.createElement('div');
    this.inner.className = styles.inner;

    this.content = document.createElement('div');
    this.content.className = styles.content;

    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = styles.buttonContainer;

    this.okButton = document.createElement('button');
    this.okButton.className = styles.buttonOk;
    this.okButton.textContent = getTranslation('prompt.ok');
    this.okButton.onclick = () => {
      this.ok();
    };

    this.cancelButton = document.createElement('button');
    this.cancelButton.className = styles.buttonCancel;
    this.cancelButton.textContent = getTranslation('prompt.cancel');
    this.cancelButton.onclick = () => {
      this.cancel();
    };

    this.buttonContainer.appendChild(this.cancelButton);
    this.buttonContainer.appendChild(this.okButton);
    this.inner.appendChild(this.content);
    this.inner.appendChild(this.buttonContainer);
    this.container.appendChild(this.inner);
  }

  hide () {
    previousPrompt = null;
    document.body.removeChild(this.container);
  }

  ok () {
    this.hide();
    this.dispatchEvent(new CustomEvent('ok'));
  }

  cancel () {
    this.hide();
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  show () {
    if (previousPrompt) {
      previousPrompt.hide();
    }
    previousPrompt = this;

    document.body.appendChild(this.container);
  }
}

export default Prompt;
