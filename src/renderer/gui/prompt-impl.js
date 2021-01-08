let promptVisible = false;
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

  // TODO: dark mode

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '999999';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.background = 'rgba(0, 0, 0, 0.5)';

  const content = document.createElement('div');
  content.style.background = 'white';
  content.style.padding = '20px';
  content.style.border = '1px solid black';
  content.style.borderRadius = '3px';
  content.style.boxShadow = 'black 0 0 10px';
  content.style.maxWidth = '480px';

  const title = document.createElement('h2');
  title.textContent = message;

  const input = document.createElement('input');
  input.value = defaultValue || '';
  input.style.display = 'block';
  input.style.width = '100%';
  input.style.marginBottom = '10px';
  input.onkeydown = e => {
    if (e.key === 'Enter') {
      okButton.click();
    }
  };

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'flex-end';

  const okButton = document.createElement('button');
  okButton.textContent = 'OK';
  okButton.onclick = () => {
    cleanup();
    resolve(input.value);
  };

  cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => {
    cleanup();
    resolve(null);
  };

  okButton.style.margin = cancelButton.style.margin = '3px';

  const cleanup = () => {
    cancelButton = null;
    document.body.removeChild(container);
  };

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
