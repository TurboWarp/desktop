from collections import namedtuple
import os
import datetime
import hashlib
import locale

# Ensure consistent locale so below strftime always outputs the same thing
locale.setlocale(locale.LC_ALL, 'C')

# Same format as `date -Ru`
date = datetime.datetime.now(datetime.UTC).strftime('%a, %d %b %Y %H:%M:%S +0000')

FileInfo = namedtuple('FileInfo', ['name', 'size', 'md5', 'sha1', 'sha256'])

def generate_release(repository_root, name, branch):
    # https://wiki.debian.org/DebianRepository/Format#A.22Release.22_files

    print(f'Creating Release for repository: {repository_root} ({branch})')

    dist_root = os.path.join(repository_root, 'dists', branch)
    architectures = ['amd64', 'arm64', 'armhf']

    release = ''
    release += f'Origin: {name}\n'
    release += f'Label: {name}\n'
    release += f'Description: {name}\n'
    release += f'Suite: {branch}\n'
    release += f'Codename: {branch}\n'
    release += 'Version: 1.0\n'
    release += f'Architectures: {" ".join(architectures)}\n'
    release += 'Components: main\n'
    release += f'Date: {date}\n'

    files = []

    # Ignore any file that isn't in this list such as Release, Release.gpg, InRelease
    include_filenames = ['Packages', 'Packages.gz']

    for dir_path, dirnames, filenames in os.walk(dist_root):
        for filename in filenames:
            if filename not in include_filenames:
                continue

            file_path = os.path.join(dir_path, filename)
            relative_file_path = file_path[len(dist_root) + 1:]

            with open(file_path, 'rb') as f:
                contents = f.read()
                size = len(contents)
                md5 = hashlib.md5(contents).hexdigest()
                sha1 = hashlib.sha1(contents).hexdigest()
                sha256 = hashlib.sha256(contents).hexdigest()
                files.append(FileInfo(
                    name=relative_file_path,
                    size=size,
                    md5=md5,
                    sha1=sha1,
                    sha256=sha256
                ))

    release += 'MD5Sum:\n'
    for file in files:
        release += f'  {file.md5} {file.size} {file.name}\n'
    release += 'SHA1:\n'
    for file in files:
        release += f'  {file.sha1} {file.size} {file.name}\n'
    release += 'SHA256:\n'
    for file in files:
        release += f'  {file.sha256} {file.size} {file.name}\n'

    return release

def write_release(repository_root, branch, release):
    release_path = os.path.join(repository_root, 'dists', branch, 'Release')
    print(f'Writing to: {release_path}')
    with open(release_path, 'w') as f:
        f.write(release)

if __name__ == '__main__':
    self_directory = os.path.dirname(os.path.realpath(__file__))
    repository_root = os.path.join(self_directory, 'deb')

    name = 'TurboWarp'
    branch = 'stable'

    release = generate_release(repository_root, name, branch)
    print(release)
    write_release(repository_root, branch, release)
