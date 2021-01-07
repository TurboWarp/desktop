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
npm ci
```

Download library files: (Technically optional, but if you don't do this then the libraries won't work)

```
node download-library-files.js
```

Build:

```bash
# Development
npm run dev

# Production (output is in `dist` folder)
npm run dist
```

## Website

The website source code is in the `docs` folder.
