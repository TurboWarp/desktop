const {app, Menu, clipboard} = require('electron');
const {translate} = require('./l10n');
const openExternal = require('./open-external');

app.on('web-contents-created', (_event, webContents) => {
  webContents.on('context-menu', (event, params) => {
    const text = params.selectionText;
    const hasText = !!text;
    const menuItems = [];

    if (params.misspelledWord) {
      for (const word of params.dictionarySuggestions) {
        menuItems.push({
          label: word,
          click: () => {
            webContents.replaceMisspelling(word);
          }
        });
      }
      menuItems.push({
        label: translate('context.add-to-dictionary'),
        click: () => {
          webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
        }
      });
      menuItems.push({
        type: 'separator'
      });
    }

    const url = params.linkURL;
    if (url) {
      menuItems.push({
        id: 'openLink',
        label: translate('context.open-link'),
        enabled: !url.startsWith('blob:'),
        click: () => {
          openExternal(url);
        }
      });
      menuItems.push({
        type: 'separator'
      });
    }

    if (params.isEditable) {
      menuItems.push({
        id: 'cut',
        label: translate('context.cut'),
        enabled: hasText,
        click: () => {
          clipboard.writeText(text);
          webContents.cut();
        }
      });
    }
    if (hasText || params.isEditable) {
      menuItems.push({
        id: 'copy',
        label: translate('context.copy'),
        enabled: hasText,
        click: () => {
          clipboard.writeText(text);
        }
      });
    }
    if (params.isEditable) {
      menuItems.push({
        id: 'Paste',
        label: translate('context.paste'),
        click: () => {
          webContents.paste();
        }
      });
    }

    if (menuItems.length > 0) {
      const menu = Menu.buildFromTemplate(menuItems);
      menu.popup();
    }
  });
});
