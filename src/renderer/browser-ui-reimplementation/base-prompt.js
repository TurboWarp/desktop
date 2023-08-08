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

    this.cancellable = true;

    this.container = document.createElement('div');
    this.container.className = styles.container;

    this.inner = document.createElement('div');
    this.inner.className = styles.inner;

    this.content = document.createElement('div');
    this.content.className = styles.content;

    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = styles.buttonContainer;

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
    if (!this.cancellable) {
      this.ok();
      return;
    }
    this.hide();
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  show () {
    if (previousPrompt) {
      previousPrompt.hide();
    }
    previousPrompt = this;

    if (this.cancellable) {
      const cancelButton = document.createElement('button');
      cancelButton.className = styles.buttonCancel;
      cancelButton.textContent = getTranslation('prompt.cancel');
      cancelButton.onclick = () => {
        this.cancel();
      };
      this.buttonContainer.appendChild(cancelButton);
    }

    const okButton = document.createElement('button');
    okButton.className = styles.buttonOk;
    okButton.textContent = getTranslation('prompt.ok');
    okButton.onclick = () => {
      this.ok();
    };
    this.buttonContainer.appendChild(okButton);

    document.body.appendChild(this.container);
  }
}

export default Prompt;
