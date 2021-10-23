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

Install dependencies:

```bash
# This will take a while and it may seem to get stuck at some point. This is normal if your internet isn't the fastest.
npm ci
```

Download library files: (Optional, but if you don't do this then the libraries won't work)

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

TurboWarp Desktop lets you configure custom JS and CSS. This is an advanced feature that is not officially supported -- use at your own risk.

Find TurboWarp Desktop's data path:

 - Windows: `%APPDATA%/TurboWarp`
 - macOS: `~/Library/Application Support/TurboWarp`
 - Linux (non-Snap): `~/.config/turbowarp-desktop`

Create the file `userscript.js` in this folder to configure custom JS. Create the file `userstyle.css` in this folder to configure custom CSS. Completely restart TurboWarp Desktop (including all windows) to apply.

## Update checker

TurboWarp Desktop includes a simple update checker. This update checker is disabled by default on local builds. It can be manually enabled by setting the `TW_ENABLE_UPDATE_CHECKER` environment variable to `1` at build-time. In builds with the update checker enabled, the checker can be disabled by modifying `tw_config.json` in the data path from previous section to contain `"disable_update_checker":true`.
