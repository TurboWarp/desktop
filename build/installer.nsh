# electron-builder generates temporary files then tells NSIS to generate the
# installer. These files will have unreliable modification times which NSIS
# will save by default, resulting in the installer changing each time it is
# generated. We disable that so that to improve reproducibility.
SetDateSave off
