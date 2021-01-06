# TurboWarp Desktop

https://desktop.turbowarp.org/

TurboWarp as a desktop app.

Licensed under the GPLv3.0. See LICENSE for more information.

Parts of this repository are based on [scratch-desktop](https://github.com/LLK/scratch-desktop).

## Building it yourself

Clone it:

```bash
git clone https://github.com/TurboWarp/desktop
cd desktop
```

Install dependencies:

```bash
npm install
```

Build:

```bash
# Development
npm run dev

# Production (output in `dist` folder)
NODE_ENV="production" NODE_OPTIONS="--max-old-space-size=4096" npm run dist
```
