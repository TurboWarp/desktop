#!/bin/bash

echo -e "\e[31m\e[1m!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo -e "!!! THIS SCRIPT IS DEPRECATED !!!"
echo -e "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\e[0m"
echo ""
echo "Please see our website instead: https://desktop.turbowarp.org/uninstall"
echo ""
echo "Press enter to ignore this warning and continue anyways."
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
