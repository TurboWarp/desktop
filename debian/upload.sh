#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Order matters. We want to make sure all the .deb files in pool are uploaded before
# we upload the new release files in dists, otherwise there can be a long period where
# apt is broken.
# --transfers=1 significantly improves reliability in our experience on both good and
# bad internet connections.
rclone copy deb/pool r2:turbowarp-pkgs/deb/pool -P --transfers=1
rclone copy deb/dists r2:turbowarp-pkgs/deb/dists -P --transfers=1
