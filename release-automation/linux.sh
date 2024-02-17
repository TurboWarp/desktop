#!/bin/bash

set -euo pipefail

await_confirmation() {
	echo "AWAITING CONFIRMATION (press enter) ..."
	read
}

# Set up an agent so we only need to enter any SSH passwords once
echo "Setting up SSH agent"
eval "$(ssh-agent)"
ssh-add

echo "THINGS TO CHECK BEFORE RUNNING:"
echo " - git pull"
echo " - pacman -Syu"
echo " - flatpak update"
echo " - snap refresh"
echo "THINGS TO CHECK FOR EACH BUILD:"
echo " - (?) > About > Is the version right?"

cd "$(dirname "$0")"
src="$(pwd)/.."
cd "$src"

# Make sure we've been manually updated as I don't know what will happen if we pull changes
# to this script while it's already running.
git fetch
if [ "$(git rev-parse HEAD)" == "$(git rev-parse @{u})" ]; then
	echo "Source is up-to-date"
else
	echo "Source is outdated, please run: git pull"
	exit 1
fi

version="$(jq -r .version package.json)"
commit="$(git rev-parse HEAD)"
echo "version $version, commit $commit"
await_confirmation

prepare_source() {
	echo "Preparing source"
	cd "$src"
	git submodule update
	npm ci
	npm run fetch
}

update_flatpak() {
	echo "Updating flatpak"
	cd "$src/../org.turbowarp.TurboWarp"
	git checkout master
	git pull
	git branch -D "$version" || true
	git branch "$version"
	git checkout "$version"
	sed -E -i "s/commit: [a-f0-9]{40}/commit: $commit/" org.turbowarp.TurboWarp.yaml
	python3 update-library.py
	python3 update-packager.py
	flatpak-node-generator npm ../turbowarp-desktop/package-lock.json
	flatpak-builder build org.turbowarp.TurboWarp.yaml --force-clean --install --user
	flatpak run org.turbowarp.TurboWarp
	await_confirmation
	git stage .
	git commit -m "Update to $version" -m "Automated"
	git push --set-upstream origin "$version"
}

update_aur() {
	echo "Updating AUR"
	cd "$src/../turbowarp-desktop-bin"
	git checkout master
	git pull
	sed -E -i "s/pkgver=.*/pkgver=$version/" PKGBUILD
	sed -E -i "s/pkgrel=.*/pkgrel=1/" PKGBUILD
	rm *.tar.zst || true
	rm *.tar.gz || true
	updpkgsums
	makepkg --printsrcinfo > .SRCINFO
	makepkg -si
	turbowarp-desktop
	await_confirmation
	git stage .
	git commit -m "Update to $version" -m "Automated"
	git push
}

update_snap() {
	echo "Updating snap"
	cd "$src"
	rm dist/*.snap || true
	npm run webpack:prod
	npx electron-builder --linux snap --publish never --config.extraMetadata.tw_dist="release-snap-$(uname -m)"
	snap install --dangerous dist/TurboWarp-*.snap
	snap run turbowarp-desktop
	await_confirmation
	snapcraft upload --release=stable dist/TurboWarp-*.snap
}

update_debian() {
	echo "Updating Debian repository"
	cd "$src/debian"
	./everything.sh
}

prepare_source
update_flatpak
update_aur
update_snap
update_debian

echo "THINGS YOU STILL NEED TO DO:"
echo " - Merge flatpak/org.turbowarp.TurboWarp PR"
echo " - Delete old binaries from Debian repository"
echo " - Upload to Microsoft Store"
echo " - Announcements"
