#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# dpkg-scanpackages generates paths relative to the working directory
cd deb

for arch in amd64 arm64 armhf; do
  echo "Scanning $arch packages"
  mkdir -p "dists/stable/main/binary-$arch"
  dpkg-scanpackages --arch "$arch" pool > "dists/stable/main/binary-$arch/Packages"
  # Generate Packages.gz
  gzip -kf9 "dists/stable/main/binary-$arch/Packages"
done
