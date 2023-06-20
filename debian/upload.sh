#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

rclone copy deb r2:turbowarp-pkgs/deb -P --transfers=1
