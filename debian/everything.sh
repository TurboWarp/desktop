#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo Downloading binaries
python3 download-binaries.py

echo Generating Packages
./scan-packages.sh

echo Generating Release
python3 generate-release.py

echo Signing Release
./sign-release.sh

echo Uploading repository
./upload.sh
