import * as fsPromises from 'node:fs/promises';
import * as pathUtil from 'node:path';
import * as childProcess from 'node:child_process';

/** @type {string} */
const GH_TOKEN = process.env.GH_TOKEN;
if (!GH_TOKEN) {
    throw new Error('GH_TOKEN environment variable not set.');
}

const githubHeaders = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${GH_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28'
};

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * @returns {string} Name of tag for current commit
 */
const getMostRecentTag = () => {
    const gitProcess = childProcess.spawnSync('git', [
        'describe',
        '--tags',
        '--abbrev=0'
    ]);

    if (gitProcess.error) {
        throw gitProcess.error;
    }

    if (gitProcess.status !== 0) {
        throw new Error(`Git returned status ${gitProcess.status} while getting tag`);
    }

    return gitProcess.stdout.toString().trim();
};

/**
 * @typedef Release
 * @property {number} id
 * @property {string} tag_name
 */

/**
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array<Release>>}
 */
const getRecentReleases = async (owner, repo) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=10`, {
        headers: githubHeaders
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching releases`);
    }
    return res.json();
};

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string} tagName
 * @returns {Promise<string>} GitHub release ID
 */
const getReleaseForTag = async (owner, repo, tagName) => {
    for (let attempt = 0; attempt < 10; attempt++) {
        const releases = await getRecentReleases(owner, repo);

        for (const release of releases) {
            if (release.tag_name === tagName) {
                return release.id;
            }
        }

        console.log(`No release found for tag ${tagName}. Checking again in a minute...`);
        await sleep(1000 * 60);
    }

    throw new Error('Could not find release');
};

/**
 * @param {string} file File name or path
 * @returns {string}
 */
const getContentType = (file) => {
    file = file.toLowerCase();
    if (file.endsWith('.exe')) return 'application/vnd.microsoft.portable-executable';
    if (file.endsWith('.dmg')) return 'application/x-apple-diskimage';
    if (file.endsWith('.deb')) return 'application/vnd.debian.binary-package';
    if (file.endsWith('.appimage')) return 'application/vnd.appimage';
    if (file.endsWith('.tar.gz')) return 'application/gzip';
    return 'application/octet-stream';
};

/**
 * @typedef Asset
 * @property {number} id
 */

/**
 * @param {string} owner
 * @param {string} repo
 * @param {number} releaseId
 * @param {string} file Absolute path. Will be uploaded with same file name.
 * @returns {Promise<Asset>}
 */
const uploadReleaseAsset = async (owner, repo, releaseId, file) => {
    const fileName = pathUtil.basename(file);
    const fileType = getContentType(fileName);
    const fileData = await fsPromises.readFile(file);

    const res = await fetch(`https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
            ...githubHeaders,
            'Content-Length': fileData.byteLength,
            'Content-Type': fileType
        },
        body: fileData
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status} uploading asset to release`);
    }
    return res.json();
};

const run = async () => {
    if (process.argv.length !== 5) {
        throw new Error('Usage: node scripts/upload-to-github-releases.js <owner> <repo> <glob>');
    }

    const owner = process.argv[2];
    const repo = process.argv[3];
    console.log(`Repo: ${owner}/${repo}`);

    const glob = process.argv[4];
    console.log(`Glob: ${glob}`);

    const filesToUpload = await Array.fromAsync(fsPromises.glob(glob));
    console.log(`Files to upload: ${filesToUpload.join(', ')}`);

    const tagName = getMostRecentTag();
    console.log(`Tag: ${tagName}`);

    const releaseId = await getReleaseForTag(owner, repo, tagName);
    console.log(`GitHub release: ${releaseId}`);

    for (const file of filesToUpload) {
        console.log(`Uploading ${file}`);
        const asset = await uploadReleaseAsset(owner, repo, releaseId, file);
        console.log(`Uploaded asset: ${asset.id}`);
    }

    console.log('Done.');
};

run()
    .then(() => {

    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
