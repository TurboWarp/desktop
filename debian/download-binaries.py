from collections import namedtuple
import urllib.request
import json
import os

Release = namedtuple('Release', ['name', 'assets'])
Asset = namedtuple('Asset', ['name', 'url'])

# ANSI escape code to clear the line and move the cursor back to the start
CLEAR_LINE = '\33[2K\r'

def get_versions(username, repository):
    with urllib.request.urlopen(f'https://api.github.com/repos/{username}/{repository}/releases') as request:
        data = json.load(request)
        releases = []
        for raw_release in data:
            if raw_release['prerelease']:
                # We don't care about prereleases at all
                continue

            assets = []
            for raw_asset in raw_release['assets']:
                assets.append(Asset(raw_asset['name'], raw_asset['browser_download_url']))
            releases.append(Release(raw_release['tag_name'], assets))

        return releases

def fetch_large_file(url):
    with urllib.request.urlopen(url) as request:
        try:
            content_length = int(request.getheader('content-length'))
        except ValueError:
            print('Content-Length not provided')
            return request.read()

        read = 0
        result = []
        size = 1
        while size != 0:
            next = request.read(100000)
            result.append(next)
            size = len(next)
            read += size
            print(f'{CLEAR_LINE}{read / content_length * 100:.1f}%', end='')

        print(CLEAR_LINE, end='')

        return bytes().join(result)

def download_as(url, save_as):
    if os.path.exists(save_as):
        print(f'{os.path.basename(save_as)} already exists, not downloading again')
        return

    print(f'Downloading {url} to {save_as}')
    contents = fetch_large_file(url)

    os.makedirs(os.path.dirname(save_as), exist_ok=True)

    # Try to write somewhat atomically so if the script is cancelled while writing the file, it won't
    # be written to the final location which would cause it to not be downloaded the next time the
    # script is run.
    temp_file = f'{save_as}.tmp'
    with open(temp_file, 'wb') as file:
        file.write(contents)
    os.rename(temp_file, save_as)

def get_dpkg_arch(filename):
    if 'amd64' in filename:
        return 'amd64'
    if 'arm64' in filename:
        return 'arm64'
    if 'armv7l' in filename:
        return 'armhf'
    raise Exception(f'Cannot find dpkg arch of {filename}')    

def download_releases(package_name, username, repository, component, repository_root):
    versions = get_versions(username, repository)
    pool_directory = os.path.join(repository_root, 'pool', component)

    release = versions[0]
    version = release.name.replace('v', '')
    # Package version should always be 1 unless the scripts screw up and generate broken packages,
    # then this may have to be incremented for some versions
    package_version = '1'

    all_names = []
    for asset in release.assets:
        name = asset.name
        if not name.endswith('.deb'):
            # Not a debian package
            continue
        
        arch = get_dpkg_arch(name)
        new_name = f'{package_name}_{version}_{package_version}_{arch}.deb'
        all_names.append(new_name)
        new_path = os.path.join(pool_directory, new_name)
        download_as(asset.url, new_path)

    # Remove extra leftover files
    for filename in os.listdir(pool_directory):
        if filename not in all_names:
            print(f'Removing extra file: {filename}')
            full_path = os.path.join(pool_directory, filename)
            os.remove(full_path)

if __name__ == '__main__':
    self_directory = os.path.dirname(os.path.realpath(__file__))
    repository_root = os.path.join(self_directory, 'deb')

    download_releases(
        package_name='turbowarp-desktop',
        username='TurboWarp',
        repository='desktop',
        component='main',
        repository_root=repository_root
    )
