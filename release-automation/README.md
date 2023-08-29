# Release automation scripts

These are the bespoke scripts that we use to semi-automatically publish our app to various Linux app stores and package repositories, a process that previously was done by hand and easily took a couple hours. Human interacton is still required for unlocking SSH keys, installing test builds, unlocking GPG keys, and briefly validating that each build works.

We publish these scripts because it's easier for us, and we hope they may be useful as a starting place for other mods. Expect to make changes.

## Linux

Due to the variety of package managers that this script relies on, this script only strives to support Arch Linux. If you modify it, it's probably not hard to make it work elsewhere. In addition to everything required to build turbowarp-desktop from source, you also need the following Arch packages:

 - base-devel
 - git
 - jq
 - gnupg
 - dpkg
 - rclone
 - gzip
 - python
 - python-aiohttp
 - pacman
 - pacman-contrib
 - flatpak
 - flatpak-builder
 - snapd (currently AUR only)

For rclone configuration, see [Debian scripts README](../debian/README.md)

The script can take a while, so it may be a good idea to disable system sleep while it's running.

```
systemd-inhibit ./linux.sh
```

## Mac App Store

```
./mas.sh
```
