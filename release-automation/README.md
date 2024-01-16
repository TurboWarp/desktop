# Release automation scripts

These are the bespoke scripts that we use to automate various aspects of releasing new versions of the app.  We publish these scripts because it's easier for us to just put them in the repository, and we hope they may be useful as a starting place for other mods. Expect to make changes.

## build.js

This is what creates most of the downloads that are up on our website and on GitHub. It takes these arguments:

```
--production
    Enables update checker and sets the distribution names to "prod-" instead of "dev-"

--windows
    Create Windows installers (Windows 10 or later)

--windows-legacy
    Create Windows installers (Windows 7 or later)

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
