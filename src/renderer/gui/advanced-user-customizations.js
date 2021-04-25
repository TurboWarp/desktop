import {ipcRenderer} from 'electron';

ipcRenderer.invoke('get-user-customizations')
    .then(({js, css}) => {
        if (!js && !css) return;

        const style = document.createElement('style');
        style.textContent = css;
        document.body.appendChild(style);

        const script = document.createElement('script');
        script.textContent = js;
        document.body.appendChild(script);
    });
