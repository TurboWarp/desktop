#!/bin/bash

echo "!!! WARNING !!!"
echo "  This script is deprecated: using it is highly discouraged."
echo "  Whenever possible, please use the other install methods listed on the https://desktop.turbowarp.org/ website."
echo "  Most of these methods can be uninstalled by simply searching for TurboWarp in your software manager and clicking remove."
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
