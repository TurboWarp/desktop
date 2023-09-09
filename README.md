# TurboWarp Desktop

TurboWarp as a desktop app.

If you're looking for downloads, head to: https://desktop.turbowarp.org/

Licensed under the GPLv3.0. See LICENSE for more information.

Parts of this repository are based on [LLK/scratch-desktop](https://github.com/LLK/scratch-desktop).

## Website

The website source code is in the `docs` folder.

## Development

We use submodules, so clone using:

```bash
git clone --recursive https://github.com/TurboWarp/desktop turbowarp-desktop
```

or run this after cloning:

```bash
git submodule init
git submodule update
```

Install dependencies using:

```bash
npm ci
```

Then fetch extra library, packager, and extension files using:

```bash
npm run fetch
```

Repeat the three previous sets of commands every time you pull changes from GitHub.

Due to the security requirements mandated by custom extensions existing, our desktop app is significantly more complicated than Scratch's.

 - **src-main** is what runs in Electron's main process. There is no build step; this code is included as-is. `src-main/entrypoint.js` is the entry point to the entire app.
 - **src-renderer-webpack** runs in an Electron renderer process to make the editor work. This is built by webpack as **dist-renderer-webpack**.
 - **src-renderer** also runs in an Electron renderer process, but without webpack. This is used for things like the privacy policy window.
 - **src-preload** runs as preload scripts in an Electron renderer process. They export glue functions to allow renderer and main to talk to each other in a somewhat controlled manner.
 - **dist-library-files** and **dist-extensions** contain additional static resources managed by `npm run fetch`

To build the webpack portions in src-renderer-webpack for development builds, run this:

```bash
npm run webpack:compile
```

You can also run this instead for source file changes to immediately trigger rebuilds:

```bash
npm run webpack:watch
```

Once you have everything compiled and fetched, you are ready to package it up for Electron. For development, start a development Electron instance with:

```bash
npm run electron:start
```

Linux note: The app icon won't work in the development version, but it will work in the packaged version.

We've found that development can work pretty well if you open two terminals side-by-side and run `npm run webpack:watch` in one and `npm run electron:start` in the other. You can refresh the windows with ctrl+R or cmd+R for renderer file changes to apply, and manually restart the app for main file changes to apply.

## Final production-ready builds

The development version of the app will be larger and slower than the final release builds.

Build an optimized version of the webpack portions with:

```bash
npm run webpack:prod
```

Then to package up the final Electron binaries, use the [electron-builder CLI](https://www.electron.build/cli). They will be saved in the `dist` folder. Some examples:

```bash
# Windows installer
npx electron-builder --windows nsis --x64

# macOS DMG
npx electron-builder --mac dmg --universal

# Linux Debian
npx electron-builder --linux deb
```

More examples in [our release script](.github/workflows/release.yml). You can typically only package for a certain operating system while on that operating system.

It is possible to give each packaged version of the app a unique *distribution ID* to help uniquely identify them -- it appears in the "About" window. Add `--config.extraMetadata.tw_dist=your-dist-id-here` to electron-builder's arguments to set the distribution ID. Additionally, to enable the in-app update checker, also add `--config.extraMetadata.tw_update=yes`.

## Advanced customizations

TurboWarp Desktop lets you configure custom JS and CSS without rebuilding the app.

Find TurboWarp Desktop's data path by using the list below or by clicking "?" in the top right corner, then "Desktop Settings", then "Open User Data", then opening the highlighted folder, or refer to this list:

 - Windows (except Microsoft Store): `%APPDATA%/turbowarp-desktop`
 - Microsoft Store: Open `%LOCALAPPDATA%/Packages`, find the folder with the word `TurboWarpDesktop` in it, then open `LocalCache/Roaming/turbowarp-desktop`
 - macOS: `~/Library/Application Support/turbowarp-desktop`
 - Linux (except Flatpak and Snap): `~/.config/turbowarp-desktop`
 - Linux (Flatpak): `~/.var/app/org.turbowarp.TurboWarp/config/turbowarp-desktop`
 - Linux (Snap): `~/snap/turbowarp-desktop/current/.config/turbowarp-desktop`

Create the file `userscript.js` in this folder to configure custom JS. Create the file `userstyle.css` in this folder to configure custom CSS. Completely restart TurboWarp Desktop (including all windows) to apply.

## Uninstall

See https://desktop.turbowarp.org/uninstall
