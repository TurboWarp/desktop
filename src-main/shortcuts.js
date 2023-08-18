const {app, BrowserWindow} = require('electron');

app.on('web-contents-created', (_event, webContents) => {
  if (process.platform === 'darwin') {
    // On Mac, shortcuts are handled by the menu bar.
    return;
  }

  webContents.on('before-input-event', (e, input) => {
    if (input.isAutoRepeat || input.isComposing || input.type !== 'keyDown' || input.meta) {
      return;
    }
    const window = BrowserWindow.fromWebContents(webContents);
    // Ctrl+Shift+I to open dev tools

    if (input.control && input.shift && input.key.toLowerCase() === 'i' && !input.alt) {
      e.preventDefault();
      webContents.toggleDevTools();
    }

    // Ctrl+N to open new window
    if (input.control && input.key.toLowerCase() === 'n') {
      e.preventDefault();
      createEditorWindow();
    }

    // Ctrl+Equals/Plus to zoom in (depends on keyboard layout)
    if (input.control && (input.key === '=' || input.key === '+')) {
      e.preventDefault();
      webContents.setZoomLevel(webContents.getZoomLevel() + 1);
    }

    // Ctrl+Minus/Underscore to zoom out
    if (input.control && input.key === '-') {
      e.preventDefault();
      webContents.setZoomLevel(webContents.getZoomLevel() - 1);
    }

    // Ctrl+0 to reset zoom
    if (input.control && input.key === '0') {
      e.preventDefault();
      webContents.setZoomLevel(0);
    }

    // F11 and alt+enter to toggle fullscreen
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {
      e.preventDefault();
      window.setFullScreen(!window.isFullScreen());
    }

    // Escape to exit fullscreen
    if (input.key === 'Escape' && window.isFullScreen()) {
      e.preventDefault();
      window.setFullScreen(false);
    }

    // Ctrl+R and Ctrl+Shift+R to reload
    if (input.control && input.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (input.shift) {
        webContents.reloadIgnoringCache();
      } else {
        webContents.reload();
      }
    }
  });
});
