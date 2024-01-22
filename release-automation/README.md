# Release automation scripts

These are the bespoke scripts that we use to automate various aspects of releasing new versions of the app.  We publish these scripts because it's easier for us to just put them in the repository, and we hope they may be useful as a starting place for other mods. Expect to make changes.

## build.js

This is what creates most of the downloads that are up on our website and on GitHub. Each run of the build script will generate one file, so if you want to package as multiple things, you'll have to run it multiple times. Doing multiple builds concurrently won't work; just run one at a time.

You must specify which type of file you want to build:

```
--windows
    Create Windows installers for Windows 10 or later

--windows-legacy
    Create Windows installers for Windows 7 or later (less secure)

--microsoft-store
    Create appx files for uploading to Microsoft Store

--mac
    Create dmg files for macOS

--debian
    Create deb files for Debian/Ubuntu/etc.
    This does not actually upload them to the apt repository. See ../debian for those scripts.

--tarball
    Create tar.gz files for Linux

--appimage
    Create AppImages for Linux
```

Optionally you also specify which architecture you're building for:

```
--x64           64-bit x86 (default on Windows, Linux)
--ia32          32-bit x86
--arm64         64-bit ARM
--armv7l        32-bit ARM
--universal     Apple Silicon and Intel in one file (macOS only, default on macOS)
```

Optionally you may also apply:

```
--production
    Enables update checker
    Adds "prod-" to the start of the distribution name
    Enables some extra warnings for people who install the wrong version of the app
    Allows notarization on macOS
```

## Linux

In addition to publishing builds on our website and GitHub, we also publish Linux builds on:

 - releases.turbowarp.org, our apt repository
 - flathub.org
 - snapcraft.io
 - aur.archlinux.org

Due to the variety of package managers that this script relies on, this script only strives to support Arch Linux. It's probably not hard to make most of it work elsewhere, but that's not a priority for us. In addition to everything required to build turbowarp-desktop from source, you also need the following Arch packages:

 - base-devel
 - git
 - jq
 - gnupg
 - dpkg
 - rclone
 - gzip
 - python
 - pacman
 - pacman-contrib
 - flatpak
 - flatpak-builder
 - [flatpak-node-generator](https://github.com/flatpak/flatpak-builder-tools/tree/master/node) which also needs:
   - python-pipx
   - python-aiohttp
 - [snapd](https://aur.archlinux.org/packages/snapd)

Then for snap uploads, you also need to install and log in to snapcraft:

```bash
snap install snapcraft --classic
snapcraft login
```

For rclone configuration, see [Debian scripts README](../debian/README.md).

## Mac App Store

Creating builds for the Mac App Store is also a separate build:

```bash
./mas.sh
```

as is uploading those builds to App Store Connect using Transporter.
