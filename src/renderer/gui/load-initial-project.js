import {ipcRenderer} from 'electron';

const isValidURL = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch (e) {
    return false;
  }
};

/**
 * @param {string} path Path to rad
 * @returns {Promise<ArrayBuffer>}
 */
const readFileFromMainThread = (path) => ipcRenderer.invoke('read-file', path);

/**
 * @param {string} url URL to fetch
 * @returns {Promise<ArrayBuffer>}
 */
const requestFromMainThreadAsArrayBuffer = (url) => ipcRenderer.invoke('request-url', url);

const requestFromMainThreadAsJSON = async (url) => {
  const buffer = await requestFromMainThreadAsArrayBuffer(url);
  const text = new TextDecoder().decode(buffer);
  const json = JSON.parse(text);
  return json;
};

const getScratchProjectID = (url) => {
  const match = url.match(/^https:\/\/scratch\.mit\.edu\/projects\/(\d+)\/?$/);
  return match ? match[1] : null;
};

const fetchScratchProject = async (id) => {
  // We are a desktop app, so we can make requests directly to the Scratch API.
  let token = null;
  try {
    // api.scratch.mit.edu has strict CORS that we can't fetch by default, so make the main thread do it
    const projectMetadata = await requestFromMainThreadAsJSON(`https://api.scratch.mit.edu/projects/${id}`);
    token = projectMetadata.project_token;
  } catch (e) {
    // For now, this error is non-critical.
    console.error(e);
  }

  const tokenPart = token ? `?token=${token}` : '';
  const url = `https://projects.scratch.mit.edu/${id}${tokenPart}`;
  // projects.scratch.mit.edu currently does not have strict CORS
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request for project ID ${id} returned status ${r.status}`);
  }
  return res.arrayBuffer();
};

const loadInitialProject = async (pathOrURL) => {
  if (isValidURL(pathOrURL)) {
    const projectId = getScratchProjectID(pathOrURL);
    if (projectId) {
      return fetchScratchProject(projectId);
    }
    return requestFromMainThreadAsArrayBuffer(pathOrURL);
  }
  return readFileFromMainThread(pathOrURL);
};

export default loadInitialProject;
