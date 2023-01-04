#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

rclone copy deb turbowarp-pkgs:turbowarp-pkgs/deb -P
