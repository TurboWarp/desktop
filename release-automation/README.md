# Release automation scripts

These are the bespoke scripts that we use to automate various aspects of releasing new versions of the app.  We publish these scripts because it's easier for us to just put them in the repository. They may be useful as a starting place for other mods. Expect to make changes.

## Build script

This is what creates most of the downloads that are up on our website and on GitHub.

Optional dependencies:

 * [Git](https://git-scm.com/) (used to get the time of the most recent commit)
 * [strip-nondeterminism](https://salsa.debian.org/reproducible-builds/strip-nondeterminism) (Linux only, used for tarballs)

You must specify which platform to build for:

```
--windows
    Create Windows installers for Windows 10 or later.

--windows-legacy
    Create Windows installers for Windows 7 or later (less secure than --windows).

--windows-portable
    Create portable Windows executables for Windows 10 or later.

--windows-dir
    Generate executables for Windows but don't package into a single executable file
    Primarily for debugging.

--microsoft-store
    Create appx files for uploading to the Microsoft Store.

--mac
    Create app for macOS 10.15 and later.

--mac-legacy-10.13-10.14
    Create app for macOS 10.13 and 10.14 (less secure than --mac).

--mac-legacy-10.15
    Create app for macOS 10.15 (less secure than --mac).

--mac-legacy-11
    Create app for macOS 11 (less secure than --mac).

--mac-dir
    Generate executables for macOS 10.15 and later but don't package into a complete DMG installer.
    Primarily for debugging.

--debian
    Create deb files for Debian, Ubuntu, and derivatives.
    Does not upload them to the apt repository; see ../debian/README.md.

--tarball
    Create tar.gz files for Linux.
    If strip-nondeterminism is installed, tarballs will be reproducible.

--appimage
    Create AppImage executables for Linux.

--linux-dir
    Generate executables for Linux but don't package into distribution-sepecific installer or format.
    Primarily for debugging.
```

You can also specify which architecture you're building for:

```
--x64
    64-bit x86. Supported on Windows, macOS, Linux.
    Default on Windows, Linux.

--ia32
    32-bit x86. Windows only.

--arm64
    64-bit ARM. Supported on Windows, macOS, Linux.

--armv7l
    32-bit ARM. Linux only.

--universal
    Combines --x64 (Intel Silicon) and --arm64 (Apple Silicon) into one file. macOS only.
    Default on macOS.
```

The script builds the full "matrix" of all options you give. For example, `--windows --windows-portable --x64 --arm64` will create four builds:

 - Windows installer for x64
 - Windows installer for ARM64
 - Windows portable for x64
 - Windows portable for ARM64

Optionally you may also apply:

```
--production
    Enables update checker.
    Adds "prod-" to the start of the distribution name.
    Enables some extra warnings for people who install the wrong version of the app.
    Allows notarization on macOS.
```

## Linux

In addition to publishing builds on our website and GitHub, we also publish Linux builds on:

 - releases.turbowarp.org, our apt repository
 - flathub.org
 - snapcraft.io
 - aur.archlinux.org

Due to the variety of package managers needed to publish to this many places, this script only strives to support Arch Linux. It's probably not hard to make most of it work elsewhere, but that's not a priority for us. In addition to everything required to build turbowarp-desktop from source, you also need the following Arch packages:

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
