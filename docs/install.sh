#!/bin/bash

set -euo pipefail

echo "!!! WARNING !!!"
echo "  This script is deprecated: using it is highly discouraged and it may cease to receive updates or function in the near future."
echo "  Please use the other install methods listed on the https://desktop.turbowarp.org/ website."
echo "  The other methods are typically more secure, often support automatic updates, integrate better into the rest of your system, and are usually easier to uninstall."
echo ""
echo "Press enter to continue anyways."
read

fatal() {
    echo "Error: $@"
    echo "Open an issue for help: https://github.com/TurboWarp/desktop/issues/new (please include full log)"
    exit 1
}

install_complete() {
    echo "Install complete"
    exit
}

command_exists() {
    command -v "$1" &> /dev/null
}

if [ "$(uname -s)" != "Linux" ]; then
    fatal "This doesn't look like Linux"
fi
if [ "$(whoami)" != "root" ]; then
    fatal "Must be run as root."
fi

VERSION="1.6.1"
ARCH="$(uname -m)"
echo "Version: $VERSION"
echo "System archictecture: $ARCH"

# Debian/Ubuntu
if command_exists apt; then
    echo "Detected Debian/Ubuntu based system"
    TMPFILE=$(mktemp --suffix=.deb)
    if [ "$ARCH" = "x86_64" ]; then
        filearch="amd64"
    elif [ "$ARCH" = "i386" ]; then
        filearch="i386"
    elif [ "$ARCH" = "armv7l" ]; then
        filearch="armv7l"
    elif [ "$ARCH" = "aarch64" ]; then
        filearch="arm64"
    else
        fatal "Unknown architecture"
    fi
    wget -O "$TMPFILE" "https://github.com/TurboWarp/desktop/releases/download/v$VERSION/TurboWarp-linux-$filearch-$VERSION.deb"
    chown _apt:root "$TMPFILE"
    apt install -y "$TMPFILE"
    rm "$TMPFILE"
    install_complete
fi

# Everything else
echo "Performing generic install"
TMPFILE=$(mktemp --suffix=.tar.gz)
if [ "$ARCH" = "x86_64" ]; then
    filearch="x64"
elif [ "$ARCH" = "i386" ]; then
    filearch="i386"
elif [ "$ARCH" = "armv7l" ]; then
    filearch="armv7l"
elif [ "$ARCH" = "aarch64" ]; then
    filearch="arm64"
else
    fatal "Unknown architecture"
fi
wget -O "$TMPFILE" "https://github.com/TurboWarp/desktop/releases/download/v$VERSION/TurboWarp-linux-$filearch-$VERSION.tar.gz"
mkdir -p /opt/TurboWarp
tar -xvf "$TMPFILE" --strip-components=1 -C /opt/TurboWarp
cp /opt/TurboWarp/resources/static/icon.png /usr/share/icons/hicolor/512x512/apps/turbowarp-desktop.png
cat > /usr/share/applications/turbowarp-desktop.desktop << EOF
[Desktop Entry]
Name=TurboWarp
Exec=/opt/TurboWarp/turbowarp-desktop %U
Terminal=false
Type=Application
Icon=turbowarp-desktop
StartupWMClass=TurboWarp
Comment=TurboWarp is a Scratch mod with a compiler to run projects faster, dark mode for your eyes, a bunch of addons to improve the editor, and more.
MimeType=application/x.scratch.sb3;
Categories=Development;
EOF
cat > /usr/share/mime/packages/turbowarp-desktop.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
<mime-type type="application/x.scratch.sb3">
  <glob pattern="*.sb3"/>
  <icon name="turbowarp-desktop"/>
</mime-type>
</mime-info>
EOF
chmod 4755 /opt/TurboWarp/chrome-sandbox
ln -sf /opt/TurboWarp/turbowarp-desktop /usr/bin/turbowarp-desktop
update-mime-database /usr/share/mime
update-desktop-database /usr/share/applications
gtk-update-icon-cache -f /usr/share/icons/hicolor/
rm "$TMPFILE"
install_complete
