import {ipcRenderer} from 'electron';
import {getTranslation} from '../translations';

const editorWindowId = +(new URLSearchParams(location.search).get('editor_id'));

const loadingProjectOuter = document.createElement('div');
loadingProjectOuter.className = 'loading-project-outer';

const loadingProjectText = document.createElement('div');
loadingProjectText.textContent = getTranslation('packager.loading');
loadingProjectText.className = 'loading-project-text';
loadingProjectOuter.appendChild(loadingProjectText);

const cancelLoadingProject = document.createElement('button');
cancelLoadingProject.textContent = getTranslation('prompt.cancel');
let loadingCancelled = false;
cancelLoadingProject.addEventListener('click', () => {
  loadingCancelled = true;
  loadingProjectOuter.remove();
});
loadingProjectOuter.appendChild(cancelLoadingProject);

// Because of how the packager is loaded, this is the easiest way to add CSS for the loading screen
const loadingProjectStyles = document.createElement('style');
loadingProjectStyles.textContent = `
.loading-project-outer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* Packager currently uses z-index up to 10 */
  z-index: 101;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  user-select: none;
}
.loading-project-text {
  color: black;
  font-size: 32px;
  margin-bottom: 20px;
}
[theme="dark"] .loading-project-outer {
  background: rgba(0, 0, 0, 0.8);
}
[theme="dark"] .loading-project-text {
  color: white;
}
`;
loadingProjectOuter.appendChild(loadingProjectStyles);

// The packager's preview feature tries to open blob: URIs, but Electron doesn't support that,
// so we'll force it to instead open a blank window and write the blob manually.
const nativeOpen = window.open;
window.open = (url) => {
  const newWindow = nativeOpen('about:blank');
  fetch(url)
    .then((r) => r.text())
    .then((text) => {
      newWindow.document.write(text);
    });
  return newWindow;
};

const loadHTML = (html) => {
  document.open();
  document.write(html);
  document.close();
};

const setProject = (data, name) => {
  // Switch to file mode
  const fileTypeRadio = document.querySelector('.file-input-option input[type=radio]');
  fileTypeRadio.click();

  // Upload project to file input
  const file = new File([data], `${name}.sb3`);
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const fileInput = document.querySelector('.file-input-option input[type=file]');
  fileInput.files = dataTransfer.files;
  fileInput.dispatchEvent(new Event('change'));
  // Packager will automatically start loading after selecting a file
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
}).catch((err) => {
  alert(err);
  close();
});
