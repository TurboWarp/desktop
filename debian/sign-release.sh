#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Parse the key from the website
key=$(gpg --list-packets ../docs/release-signing-key.gpg | grep "keyid:" | awk '{print $2}')
echo "Key: $key"

echo "Creating Release.gpg"
rm -f deb/dists/stable/Release.gpg
gpg --local-user "$key" --armor --detach-sign --output deb/dists/stable/Release.gpg --sign deb/dists/stable/Release

echo "Creating InRelease"
rm -f deb/dists/stable/InRelease
gpg --local-user "$key" --clearsign --armor --detach-sign --output deb/dists/stable/InRelease --sign deb/dists/stable/Release
