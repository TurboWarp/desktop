import {app} from 'electron';

// We might have a user agent like:
// Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) turbowarp-desktop/0.8.0 Chrome/91.0.4472.124 Electron/13.1.7 Safari/537.36
// We want to remove the Electron/ and turbowarp-desktop/ parts so that we look like a normal Chrome
app.userAgentFallback = app.userAgentFallback
  .replace(/Electron\/[0-9.]+/, '')
  .replace(`${app.getName()}/${app.getVersion()}`, '')
  .replace(/ {2,}/g, ' '); 
