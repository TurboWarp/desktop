# TurboWarp Desktop

TurboWarp as a desktop app.

If you're looking for downloads, head to: https://desktop.turbowarp.org/

Licensed under the GPLv3.0. See LICENSE for more information.

Parts of this repository are based on [LLK/scratch-desktop](https://github.com/LLK/scratch-desktop).

## Building it yourself

Install these:

 - [Git](https://git-scm.com/)
 - [Node.js](https://nodejs.org/en/)

You'll need to open a terminal for the next steps.

Clone it:

```bash
git clone https://github.com/TurboWarp/desktop turbowarp-desktop
cd turbowarp-desktop
```

Install dependencies after each update:

```bash
# This will take a while.
npm ci
```

Download library files and packager HTML after each update: (Optional, but if you don't do this then some features may not work)

```
npm run fetch
```

Build:

```bash
# Development
npm start

# Production (output is in `dist` folder)
npm run dist
# If it crashes with "JavaScript heap out of memory", try:
NODE_OPTIONS=--max-old-space-size=4096 npm run dist
```

## Website

The website source code is in the `docs` folder.

## Advanced customizations

TurboWarp Desktop lets you configure custom JS and CSS.

Find TurboWarp Desktop's data path by using the list below or by clicking "?" in the top left corner, then "Desktop Settings", then "Open User Data Folder", then opening the highlighted folder.

 - Windows (except Microsoft Store): `%APPDATA%/turbowarp-desktop`
 - Microsoft Store: Open `%LOCALAPPDATA%/Packages`, find the folder with the word `TurboWarpDesktop` in it, then open `LocalCache/Roaming/turbowarp-desktop`
 - macOS: `~/Library/Application Support/turbowarp-desktop`
 - Linux (except Snap, Flatpak): `~/.config/turbowarp-desktop`
 - Linux (Snap): `~/snap/turbowarp-desktop/current/.config/turbowarp-desktop`
 - Linux (Flatpak): `~/.var/app/org.turbowarp.TurboWarp/config/turbowarp-desktop`

Create the file `userscript.js` in this folder to configure custom JS. Create the file `userstyle.css` in this folder to configure custom CSS. Completely restart TurboWarp Desktop (including all windows) to apply.

## Update checker

TurboWarp Desktop includes a simple update checker. This update checker is disabled by default on local builds. To manally enable it, set the `TW_ENABLE_UPDATE_CHECKER` environment variable to `1` at build-time. In builds with the update checker enabled, the checker can be disabled through the "(?) > Desktop Settings" menu or by setting the `TW_DISABLE_UPDATE_CHECKER` environment variable to `1` at runtime.
