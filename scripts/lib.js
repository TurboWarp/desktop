import * as nodeCrypto from 'node:crypto';

/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export const computeMD5 = (buffer) => nodeCrypto
  .createHash('md5')
  .update(new Uint8Array(buffer))
  .digest('hex');

/**
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export const computeSHA256 = (buffer) => nodeCrypto
  .createHash('sha256')
  .update(new Uint8Array(buffer))
  .digest('hex');

/**
 * @param {string} url
 * @param {RequestInit} [opts]
 * @returns {Promise<Response>}
 */
export const persistentFetch = async (url, opts) => {
  let err;
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, opts);
      if (response.status !== 200) {
        throw new Error(`${md5ext}: Unexpected status code: ${response.status}`);
      }
      return response;
    } catch (e) {
      if (i === 0) err = e;
      console.warn(`Attempt to fetch ${url} failed, trying again...`);
    }
  }
  throw err;
};
