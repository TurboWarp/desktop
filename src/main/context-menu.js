import {Menu, clipboard} from 'electron';

const setupContextMenu = (webContents) => {
  webContents.on('context-menu', (event, params) => {
    const text = params.selectionText;
    const hasText = !!text;
    const menuItems = [];

    if (params.isEditable && params.misspelledWord) {
      menuItems.push({
        id: 'learnSpelling',
        label: '&Learn Spelling',
        visible: params.isEditable && params.misspelledWord,
        click() {
          webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
        }
      });
      menuItems.push({
        type: 'separator'
      });
    }

    menuItems.push({
      id: 'cut',
      label: 'Cu&t',
      enabled: hasText,
      click: () => {
        clipboard.writeText(text);
        webContents.cut();
      }
    });
    menuItems.push({
      id: 'copy',
      label: '&Copy',
      enabled: hasText,
      click: () => {
        clipboard.writeText(text);
      }
    });
    menuItems.push({
      id: 'Paste',
      label: '&Paste',
      click: () => {
        webContents.paste();
      }
    });

    const menu = Menu.buildFromTemplate(menuItems);
    menu.popup();
  });
}

export default setupContextMenu;
