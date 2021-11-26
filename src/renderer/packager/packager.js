import {ipcRenderer} from 'electron';
import {getTranslation} from '../translations';

const editorWindowId = +(new URLSearchParams(location.search).get('editor_id'));

const loadingProjectOuter = document.createElement('div');
// Due to how the packager HTML is loaded, it's easiest to use inline styles here
loadingProjectOuter.style.position = 'absolute';
loadingProjectOuter.style.top = '0';
loadingProjectOuter.style.left = '0';
loadingProjectOuter.style.width = '100%';
loadingProjectOuter.style.height = '100%';
loadingProjectOuter.style.zIndex = '10';
loadingProjectOuter.style.background = 'rgba(0, 0, 0, 0.8)';
loadingProjectOuter.style.display = 'flex';
loadingProjectOuter.style.flexDirection = 'column';
loadingProjectOuter.style.alignItems = 'center';
loadingProjectOuter.style.justifyContent = 'center';
loadingProjectOuter.style.textAlign = 'center';
loadingProjectOuter.style.userSelect = 'none';

const loadingProjectText = document.createElement('div');
loadingProjectText.textContent = getTranslation('packager.loading');
loadingProjectText.style.color = 'white';
loadingProjectText.style.fontSize = '32px';
loadingProjectText.style.marginBottom = '20px';
loadingProjectOuter.appendChild(loadingProjectText);

const cancelLoadingProject = document.createElement('button');
cancelLoadingProject.textContent = getTranslation('prompt.cancel');
let loadingCancelled = false;
cancelLoadingProject.addEventListener('click', () => {
  loadingCancelled = true;
});
loadingProjectOuter.appendChild(cancelLoadingProject);

window.open = (url) => {
  // The packager's preview feature tries to open blob: URIs, but Electron doesn't support that,
  // so we'll instead open a blank window and write the blob manually.
  const newWindow = window.open('about:blank');
  fetch(url)
    .then((r) => r.text())
    .then((text) => {
      newWindow.document.write(text);
    });
  return newWindow;
};

const loadHTML = (html) => {
  document.write(html);
  document.close();
};

const setProject = (data, name) => {
  // Switch to file mode
  const fileTypeRadio = document.querySelector('input[type=radio][value=file]');
  fileTypeRadio.click();
  
  // Upload project to file input
  const file = new File([data], `${name}.sb3`);
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const fileInput = document.querySelector('input[type=file]');
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('change'));

  // Start loading the project
  // We need a delay to avoid cancellation-related issues
  setTimeout(() => {
    const loadButton = document.querySelector('.card button');
    loadButton.click();
  });
};

const getPackagerHTML = () => ipcRenderer.invoke('get-packager-html')
  .then((raw) => new TextDecoder().decode(raw));

const getProjectFromEditor = () => {
  ipcRenderer.on('export-project/ack', () => {
    document.body.prepend(loadingProjectOuter);
  });
  ipcRenderer.on('export-project/done', (event, {data, name}) => {
    loadingProjectOuter.remove();
    if (!loadingCancelled) {
      setProject(data, name);
    }
  });
  ipcRenderer.on('export-project/error', () => {
    loadingProjectOuter.remove();
  });
  ipcRenderer.sendTo(editorWindowId, 'export-project/start');
};

getPackagerHTML().then((html) => {
  loadHTML(html);
  getProjectFromEditor();
});
