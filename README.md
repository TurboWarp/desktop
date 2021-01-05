# turbowarp-desktop

TurboWarp as a desktop app.

Licensed under the GPLv3.0. See LICENSE for more information.

## Building it yourself

TODO: untested, probably doesn't work, need to fix some things...

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
npm run dist
```

<!--
## Build

```bash
npm i
npm run build
```

Building scratch-gui

```bash
$env:STATIC_PATH="static"; $env:NODE_ENV="production"; npm run build
```

Building

$env:NODE_ENV="production"
$env:NODE_OPTIONS="--max-old-space-size=4096"
-->
