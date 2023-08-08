#!/bin/bash

echo "!!! WARNING !!!"
echo "  This script is deprecated: using it is highly discouraged and it may cease to function in the near future."
echo "  If you used one of the recommended installation methods, then use your system's package manager (eg. apt, pacman, flatpak, snap) to uninstall the app."
echo "  On many distributions, if you right-click on the app's launcher, there's an easy way to uninstall it without touching a terminal."
echo "  If you need help uninstalling TurboWarp, please reach out: https://github.com/TurboWarp/desktop/discussions or email contact [at] turbowarp.org"
echo ""
echo "Press enter to continue."
read

if [ "$USER" != "root" ]; then
    echo "Must be run as root."
    exit 1
fi

echo "We're going to try to uninstall the app in a bunch of different ways."
echo "You will probably see a bunch of errors, this is normal and can be ignored."
echo "(Press enter to continue)"
read

# Snap
snap remove turbowarp-desktop

# Debian/Ubuntu
apt purge -y turbowarp-desktop

# Everything else
rm /usr/share/applications/turbowarp-desktop.desktop
rm /usr/share/mime/packages/turbowarp-desktop.xml
rm /usr/share/icons/hicolor/512x512/apps/turbowarp-desktop.png
rm -rf /opt/TurboWarp

update-mime-database /usr/share/mime
update-desktop-database /usr/share/applications
gtk-update-icon-cache -f /usr/share/icons/hicolor/

echo "Should be uninstalled."
