try {
  require('./index');
} catch (error) {
  // It's very important that this code here be minimal and self-contained so
  // that we don't have an error in the error handling code.
  console.error(error);
  const {app, dialog} = require('electron');
  app.whenReady().then(() => {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'Error',
      message: `Error starting main process:\n\n${(error && error.stack) ? error.stack : error}`
    });
    app.exit(1);
  });
}
