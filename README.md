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

In Linux, The app icon won't work in the development version, but it will work in the packaged version.

We've found that development can work pretty well if you open two terminals side-by-side and run `npm run webpack:watch` in one and `npm run electron:start` in the other. You can refresh the windows with ctrl+R or cmd+R for renderer file changes to apply, and manually restart the app for main file changes to apply.

## Linux sandbox helper error

On some Linux distributions, Electron will crash with the message `The SUID sandbox helper binary was found, but is not configured correctly. Rather than run without sandboxing I'm aborting now. You need to make sure that /home/.../turbowarp-desktop/node_modules/electron/dist/chrome-sandbox is owned by root and has mode 4755.`. Notably we have seen this happen on Debian 10 and earlier and Ubuntu 24.04 and later.

For development, you can run these commands to enable unprivileged user namespaces until you reboot:

```bash
# Enable unprivileged user namespaces.
sudo sysctl -w kernel.unprivileged_userns_clone=1

# Stop AppArmor from preventing unprivileged user namespace creation by default.
# If your distribution does not use AppArmor then you can ignore the error.
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```

There are ways to make this permanent, but we don't think you should be making permanent kernel configuration changes just to develop this app. This error won't happen in the final .deb package, Flathub, or Snap Store releases.

## Final production-ready builds

The development version of the app will be larger and slower than the final release builds.

Build an optimized version of the webpack portions with:

```bash
npm run webpack:prod
```

Then to package up the final Electron binaries, use either our build script `release-automation/build.mjs` (see [release-automation/README.md](release-automation/README.md)) or the [electron-builder CLI](https://www.electron.build/cli). Either way the final builds are saved in the `dist` folder. Here are some examples using the electron-builder CLI directly:

```bash
# You can also do manual builds with electron-builder's CLI, for example:
# Windows installer
npx electron-builder --windows nsis --x64
# macOS DMG
npx electron-builder --mac dmg --universal
# Linux Debian
npx electron-builder --linux deb
```

You can typically only package for a certain operating system while on that operating system.

## Code signing policy

TurboWarp Desktop uses a free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

 * Approvers:
   * [GarboMuffin](https://github.com/GarboMuffin)
 * Privacy policy: https://desktop.turbowarp.org/privacy.html

## Advanced customizations

TurboWarp Desktop lets you configure custom JS and CSS without rebuilding the app.

Find TurboWarp Desktop's data path by using the list below or by clicking "?" in the top right corner, then "Desktop Settings", then "Open User Data", then opening the highlighted folder, or refer to this list:

 - Windows (except Microsoft Store): `%APPDATA%/turbowarp-desktop`
 - Microsoft Store: Open `%LOCALAPPDATA%/Packages`, find the folder with the word `TurboWarpDesktop` in it, then open `LocalCache/Roaming/turbowarp-desktop`
 - macOS (except Mac App Store): `~/Library/Application Support/turbowarp-desktop`
 - Mac App Store: `~/Library/Containers/org.turbowarp.desktop/Data/Library/Application Support/turbowarp-desktop` (note that the `org.turbowarp.desktop` part may appear as `TurboWarp` in Finder)
 - Linux (except Flatpak and Snap): `~/.config/turbowarp-desktop`
 - Linux (Flatpak): `~/.var/app/org.turbowarp.TurboWarp/config/turbowarp-desktop`
 - Linux (Snap): `~/snap/turbowarp-desktop/current/.config/turbowarp-desktop`

Create the file `userscript.js` in this folder to configure custom JS. Create the file `userstyle.css` in this folder to configure custom CSS. Completely restart TurboWarp Desktop (including all windows) to apply.

## Uninstall

See https://desktop.turbowarp.org/uninstall
