// import {ipcRenderer} from 'electron';
// import styles from './prompt.css';
// import Prompt from './base-prompt';

// const INPUT_ID = 'prompt-input';

// window.prompt = (message, defaultValue) => new Promise((resolve) => {
//   const prompt = new Prompt();

//   const title = document.createElement('h2');
//   title.className = styles.title;

//   const titleLabel = document.createElement('label');
//   titleLabel.textContent = message;
//   titleLabel.htmlFor = INPUT_ID;

//   const input = document.createElement('input');
//   input.value = defaultValue || '';
//   input.className = styles.input;
//   input.id = INPUT_ID;
//   input.onkeydown = e => {
//     if (e.key === 'Enter') {
//       prompt.ok();
//     }
//   };

//   title.appendChild(titleLabel);
//   prompt.content.appendChild(title);
//   prompt.content.appendChild(input);
//   prompt.show();
//   input.focus();
//   input.select();

//   prompt.addEventListener('ok', () => {
//     resolve(input.value);
//   });
//   prompt.addEventListener('cancel', () => {
//     resolve(null);
//   });
// });

// window.alert = (message) => {
//   ipcRenderer.sendSync('alert', message);
// };

// window.confirm = (message) => {
//   return ipcRenderer.sendSync('confirm', message);
// };
