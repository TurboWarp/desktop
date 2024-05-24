/*!
This is based on https://github.com/discordjs/RPC, which we use under this license:
MIT License

Copyright (c) 2022 devsnek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const net = require('net');
const pathUtil = require('path');
const nodeCrypto = require('crypto');
const {APP_NAME} = require('./brand');
const settings = require('./settings');

// Ask garbomuffin for changes
// https://discord.com/developers/applications
const APPLICATION_ID = '1243008354037665813';
const LARGE_IMAGE_NAME = 'icon';

const OP_HANDSHAKE = 0;
const OP_FRAME = 1;
const OP_CLOSE = 2;
const OP_PING = 3;
const OP_PONG = 4;

// Note that we can't use the randomUUID from web crypto as we need to support Electron 22.
const nonce = () => nodeCrypto.randomUUID();

/**
 * @param {number} i
 * @returns {string[]}
 */
const getSocketPaths = (i) => {
  if (process.platform === 'win32') {
    // TODO: test
    return [
      `\\\\?\\pipe\\discord-ipc-${i}`
    ];
  }

  if (process.platform === 'darwin') {
    // TODO: figure out
    return [];
  }

  if (process.platform === 'linux') {
    const tempDir = (
      process.env.XDG_RUNTIME_DIR ||
      process.env.TMPDIR ||
      process.env.TMP ||
      process.env.TEMP ||
      '/tmp'
    );

    return [
      pathUtil.join(tempDir, `discord-ipc-${i}`), // Native
      pathUtil.join(tempDir, `app/com.discordapp.Discord/discord-ipc-${i}`), // Flathub
      // TODO: snap
      // TODO: vesktop, etc.?
    ];
  }

  return [];
};

/**
 * @param {string} path
 * @returns {Promise<net.Socket>}
 */
const tryOpenSocket = (path) => {
  return new Promise((resolve, reject) => {
    const socket = net.connect(path);
    const onConnect = () => {
      removeListeners();
      resolve(socket);
    };
    const onError = (error) => {
      removeListeners();
      reject(error);
    };
    const onTimeout = () => {
      removeListeners();
      reject(new Error('Timed out'));
    };
    const removeListeners = () => {
      socket.off('connect', onConnect);
      socket.off('error', onError);
      socket.off('timeout', onTimeout);
    };
    socket.on('connect', onConnect);
    socket.on('error', onError);
    socket.on('timeout', onTimeout);
  });
};

/**
 * @returns {Promise<net.Socket>}
 */
const findIPCSocket = async () => {
  for (let i = 0; i < 10; i++) {
    for (const path of getSocketPaths(i)) {
      console.log('trying', path);
      try {
        return await tryOpenSocket(path)
      } catch (e) {
        // keep trying the next one
        console.error(e);
      }
    }
  }

  throw new Error('Could not open IPC');
};

class RichPresence {
  constructor () {
    /**
     * @private
     * @type {Buffer}
     */
    this.buffer = Buffer.alloc(0);

    /**
     * @private
     * @type {net.Socket|null}
     */
    this.socket = null;

    /**
     * @private
     * @type {NodeJS.Timeout|null}
     */
    this.reconnectTimeout = null;

    /**
     * @private
     * @type {NodeJS.Timeout|null}
     */
    this.activityInterval = null;

    /**
     * @private
     * @type {string|null}
     */
    this.activityTitle = null;

    /**
     * @private
     * @type {number}
     */
    this.activityStartTime = 0;

    /**
     * @private
     * @type {boolean}
     */
    this.enabled = false;
  }

  enable () {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.connect();
  }

  disable () {
    if (!this.enabled) {
      return;
    }
    this.enabled = false;
    this.disconnect();
  }

  /**
   * @private
   */
  async connect () {
    try {
      this.socket = await findIPCSocket();
    } catch (e) {
      console.error(e);
      this.connectionLost();
      return;
    }

    this.buffer = Buffer.alloc(0);
    this.socket.on('data', (data) => {
      this.handleSocketData(data)
    });

    this.socket.on('close', () => {
      this.connectionLost();
    });

    this.socket.on('error', (err) => {
      // Only catching this to log the error and avoid uncaught main thread error.
      // Close event will be fired afterwards, so we don't need to do anything else.
      console.error(err);
    });

    this.write(OP_HANDSHAKE, {
      v: 1,
      client_id: APPLICATION_ID
    });
  }

  /**
   * @private
   */
  disconnect () {
    // Stop current connection
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }

    // Stop pending reconnection
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = null;

    // Stop activity interval
    clearInterval(this.activityInterval);
    this.activityInterval = null;
  }

  /**
   * @private
   */
  connectionLost () {
    if (this.reconnectTimeout || !this.enabled) {
      return;
    }

    clearInterval(this.activityInterval);
    this.activityInterval = null;

    console.log('Scheduled a reconnection');
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 15 * 1000);
  }

  /**
   * @private
   * @returns {boolean}
   */
  canWrite () {
    return !!this.socket && this.socket.readyState === 'open';
  }

  /**
   * @private
   * @param {number} op See constants
   * @param {unknown} data Object to be JSON.stringify()'d
   */
  write (op, data) {
    if (!this.canWrite()) {
      return;
    }

    console.log('writing', op, data);
    const payloadJSON = JSON.stringify(data);
    const payloadLength = Buffer.byteLength(payloadJSON);
    const packet = Buffer.alloc(8 + payloadLength);
    packet.writeInt32LE(op, 0);
    packet.writeInt32LE(payloadLength, 4);
    packet.write(payloadJSON, 8, payloadLength);
    this.socket.write(packet);
  }

  /**
   * @private
   * @param {Buffer} data
   */
  handleSocketData (data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.parseBuffer();
  }

  /**
   * @private
   */
  parseBuffer () {
    if (this.buffer.byteLength < 8) {
      // Wait for header.
      return;
    }

    const op = this.buffer.readUint32LE(0);
    const length = this.buffer.readUint32LE(4);

    if (this.buffer.byteLength < 8 + length) {
      // Wait for full payload.
      return;
    }

    const payload = this.buffer.subarray(8, 8 + length);
    try {
      const parsedPayload = JSON.parse(payload.toString('utf-8'));
      this.handleMessage(op, parsedPayload);
    } catch (e) {
      console.error('error parsing rich presence', e);
    }

    // Regardless of success or failure, discard the packet
    this.buffer = this.buffer.subarray(8 + length);

    // If there's another packet in the buffer, parse it now
    this.parseBuffer();
  }

  /**
   * @private
   * @param {number} op See constants
   * @param {unknown} data Parsed JSON object
   */
  handleMessage (op, data) {
    console.log('received', op, data);

    switch (op) {
      case OP_PING: {
        this.write(OP_PONG, data);
        break;
      }

      case OP_CLOSE: {
        this.socket = null;

        clearInterval(this.activityInterval);
        this.activityInterval = null;

        // reconnection will be attempted when the socket actually closes

        break;
      }

      case OP_FRAME: {
        if (data.evt === 'READY') {
          this.handleReady();
        }
        break;
      }
    }
  }

  /**
   * @private
   */
  handleReady () {
    if (this.activityTitle !== null) {
      this.activityChanged();
    }
  }

  /**
   * @param {string} title
   * @param {number} startTime
   */
  setActivity (title, startTime) {
    this.activityTitle = title;
    this.activityStartTime = startTime;
    this.activityChanged();
  }

  clearActivity () {
    this.activityTitle = null;
    this.activityStartTime = 0;
    this.activityChanged();
  }

  /**
   * @private
   */
  activityChanged () {
    if (this.activityInterval) {
      return;
    }

    console.log('Starting the activity loop');
    this.writeActivity();
    this.activityInterval = setInterval(() => {
      this.writeActivity();
    }, 1000 * 15);
  }

  /**
   * @private
   */
  writeActivity () {
    console.log('Activity timer ticked', this.activityTitle);

    if (this.activityTitle === null) {
      this.write(OP_FRAME, {
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid
        },
        nonce: nonce()
      });
    } else {
      this.write(OP_FRAME, {
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid,
          activity: {
            // Needs to be at least 2 characters long
            details: this.activityTitle.padEnd(2, ' '),
            timestamps: {
              start: this.activityStartTime,
            },
            assets: {
              large_image: LARGE_IMAGE_NAME,
              large_text: APP_NAME
            },
            instance: false
          }
        },
        nonce: nonce()
      });
    }
  }
}

const richPresenceSingleton = new RichPresence();

if (settings.richPresence) {
  richPresenceSingleton.enable();
}

module.exports = richPresenceSingleton;
