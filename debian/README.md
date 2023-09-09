# Debian repository scripts

These are the scripts that manage the Debian repository.

They work by downloading the .deb files from GitHub releases, setting things up so that `apt` will be able to understand how to install them, and then uploading the signed files to a server.

These scripts will only work on Linux. You must have python3, gzip, gpg, rclone, and dpkg installed. These scripts don't use `apt` or try to install .deb files, but they do use `dpkg-scanpackages`. Many distributions that aren't Debian based will still let you install the dpkg helper binaries. `rclone` is used for uploading the final binaries, but you can really use whatever you want for this.

All commands here assume you are in the same directory as this file (`debian`).

## Generating GPG key

Run:

```bash
gpg --full-generate-key
```

Use the options:

 - (4) RSA (sign only)
 - 4096 bits
 - 0 = key does not expire

Then find the key's ID from:

```bash
gpg --list-keys
```

Finally export the public key with:

```bash
gpg --armor --export THE_KEY_ID_HERE > ../docs/release-signing-key.gpg
```

The signing script will automatically parse that file to determine which key to ask gpg to use.

## Configure rclone

By default, our upload script uploads to an [rclone](https://rclone.org/) remote called `r2` and bucket `turbowarp-pkgs`.

## Updating the repository

Once a GitHub release is made, updating the repository is fully automated by running one script:

```bash
./everything.sh
```
