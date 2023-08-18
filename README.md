# TurboWarp Desktop

TurboWarp as a desktop app.

If you're looking for downloads, head to: https://desktop.turbowarp.org/

Licensed under the GPLv3.0. See LICENSE for more information.

Parts of this repository are based on [LLK/scratch-desktop](https://github.com/LLK/scratch-desktop).

## Website

The website source code is in the `docs` folder.

## App Architecture

Due to TurboWarp's rather unique security requirements (the existence of custom extensions), our desktop app is more complicated than Scratch's.

 - **src-main** is what runs in Electron's main process. There is no build step; this code is included as-is.
 - **src-renderer-webpack** runs in an Electron renderer process to make the editor work. This is built by webpack as **dist-renderer-webpack**.
 - **src-renderer** also runs in an Electron renderer process. This is used for things like the privacy policy window where webpack is completely unnecessary.
 - **src-preload** runs as preload scripts in an Electron renderer process. They export glue functions to allow renderer and main to talk to each other in a somewhat controlled manner.
 - **dist-library-files**, **dist-packager**, and **dist-extensions** contain additional static resources managed by manual fetch scripts.

<!-- ```bash
git clone --recursive https://github.com/TurboWarp/desktop turbowarp-desktop
cd turbowarp-desktop
```

We use git submodules for some dependencies so either use `--recursive` or run `git submodule init` later.

Install dependencies after each update:

```bash
npm ci
```

Download library files, packager HTML, and extensions after each update:

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
``` -->

<!-- ## Advanced customizations

TurboWarp Desktop lets you configure custom JS and CSS.

Find TurboWarp Desktop's data path by using the list below or by clicking "?" in the top right corner, then "Desktop Settings", then "Open User Data Folder", then opening the highlighted folder.

 - Windows (except Microsoft Store): `%APPDATA%/turbowarp-desktop`
 - Microsoft Store: Open `%LOCALAPPDATA%/Packages`, find the folder with the word `TurboWarpDesktop` in it, then open `LocalCache/Roaming/turbowarp-desktop`
 - macOS: `~/Library/Application Support/turbowarp-desktop`
 - Linux (except Snap, Flatpak): `~/.config/turbowarp-desktop`
 - Linux (Snap): `~/snap/turbowarp-desktop/current/.config/turbowarp-desktop`
 - Linux (Flatpak): `~/.var/app/org.turbowarp.TurboWarp/config/turbowarp-desktop`

Create the file `userscript.js` in this folder to configure custom JS. Create the file `userstyle.css` in this folder to configure custom CSS. Completely restart TurboWarp Desktop (including all windows) to apply. -->

## Uninstall

See https://desktop.turbowarp.org/uninstall
