import {ipcRenderer} from 'electron';

ipcRenderer.on('loaded-html', (event, bytes) => {
  const decoded = new TextDecoder().decode(bytes);
  document.write(decoded);
  document.close();
});

ipcRenderer.on('error-loading-html', (event, error) => {
  alert(error);
  close();
});
