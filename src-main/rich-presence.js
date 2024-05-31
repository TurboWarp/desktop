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
const {translate} = require('./l10n');
const {getPlatform} = require('./platform');
const settings = require('./settings');

// Ask GarboMuffin for changes
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
    return [
      `\\\\?\\pipe\\discord-ipc-${i}`
    ];
  }

  // All other platforms are Unix-like
  const tempDir = (
    process.env.XDG_RUNTIME_DIR ||
    process.env.TMPDIR ||
    process.env.TMP ||
    process.env.TEMP ||
    '/tmp'
  );

  // There are a lot of ways to install Discord on Linux
  if (process.platform === 'linux') {
    return [
      // Native
      pathUtil.join(tempDir, `discord-ipc-${i}`),
      // Flatpak
      pathUtil.join(tempDir, `app/com.discordapp.Discord/discord-ipc-${i}`),
      // Snap
      pathUtil.join(tempDir, `snap.discord/discord-ipc-${i}`),
    ];
  }

  // macOS and, theoretically, other Unixes
  return [
    pathUtil.join(tempDir, `discord-ipc-${i}`)
  ];
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
      try {
        return await tryOpenSocket(path)
      } catch (e) {
        // keep trying the next one
        console.error('Error connecting to rich presence IPC', e);
      }
    }
  }

  throw new Error('All paths failed');
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
    this.activityTimeout = null;

    /**
     * @private
     * @type {string}
     */
    this.activityTitle = '';

    /**
     * @private
     * @type {number}
     */
    this.activityStartTime = Date.now();

    /**
     * @private
     * @type {boolean}
     */
    this.checkedAutomaticEnable = false;

    /**
     * @private
     * @type {boolean}
     */
    this.enabled = false;

    this.handleSocketData =  this.handleSocketData.bind(this);
    this.handleSocketClose =  this.handleSocketClose.bind(this);
    this.handleSocketError =  this.handleSocketError.bind(this);
  }

  isAvailable () {
    // In the Mac App Store, our tmpdir is ~/Library/Containers/org.turbowarp.desktop/Data/tmp/
    //    while the IPC file is /var/folders/.../.../T/discord-ipc-#
    // In the Linux Snap Store, our tmpdir is /run/user/.../snap.turbowarp-desktop/
    //    while the IPC file is /run/user/.../snap.discord/discord-ipc-#
    // In both cases the platform sandbox should stop us from accessing the IPC file.
    return !(process.mas || getPlatform() === 'linux-snap');
  }

  checkAutomaticEnable () {
    if (this.checkedAutomaticEnable) {
      return;
    }
    this.checkedAutomaticEnable = true;
    if (settings.richPresence && this.isAvailable()) {
      this.enable();
    }
  }

  enable () {
    if (this.enabled) {
      return;
    }
    this.checkedAutomaticEnable = true;
    this.enabled = true;
    this.connect();
  }

  disable () {
    if (!this.enabled) {
      return;
    }
    this.checkedAutomaticEnable = true;
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
      console.error('Could not connect to rich presence RPC', e);
      this.stopFurtherWrites();
      this.reconnect();
      return;
    }

    if (!this.enabled) {
      this.stopFurtherWrites();
      return;
    }

    this.buffer = Buffer.alloc(0);

    this.socket.on('data', this.handleSocketData);
    this.socket.on('close', this.handleSocketClose);
    this.socket.on('error', this.handleSocketError);

    this.write(OP_HANDSHAKE, {
      v: 1,
      client_id: APPLICATION_ID
    });
  }

  /**
   * @private
   */
  disconnect () {
    this.stopFurtherWrites();

    if (this.reconnectTimeout) {
      // Stop pending reconnection
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * @private
   */
  reconnect () {
    if (this.reconnectTimeout || !this.enabled) {
      return;
    }

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
  handleSocketClose () {
    this.stopFurtherWrites();
    this.reconnect();
  }

  /**
   * @private
   * @param {Error} error
   */
  handleSocketError (error) {
    // Only catching this to log the error and avoid uncaught main thread error.
    // Close event will be fired afterwards, so we don't need to do anything else.
    console.error('Rich presence socket error', error);
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
      console.error('Error parsing rich presence IPC data', e);
    }

    // Regardless of success or failure, discard the packet
    this.buffer = this.buffer.subarray(8 + length);

    // If there's another packet in the buffer, parse it now
    this.parseBuffer();
  }

  /**
   * @private
   */
  stopFurtherWrites () {
    if (this.socket) {
      this.socket.off('data', this.handleSocketData);
      this.socket.off('close', this.handleSocketClose);
      this.socket.off('error', this.handleSocketError);
      this.socket.end();
      this.socket = null;
    }

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  /**
   * @private
   * @param {number} op See constants
   * @param {unknown} data Parsed JSON object
   */
  handleMessage (op, data) {
    switch (op) {
      case OP_PING: {
        this.write(OP_PONG, data);
        break;
      }

      case OP_CLOSE: {
        this.stopFurtherWrites();
        // reconnection will be attempted when the socket actually closes
        break;
      }

      case OP_FRAME: {
        if (data.evt === 'READY') {
          this.handleReady();
        } else if (data.cmd === 'SET_ACTIVITY') {
          // They send us an acknowledgement; ignore it
        } else {
          console.error('Unrecognized rich presence IPC frame', op, data);
        }
        break;
      }

      default: {
        console.error('Unrecognized rich presence IPC data', op, data);
        break;
      }
    }
  }

  /**
   * @private
   */
  handleReady () {
    this.writeActivity();
  }

  /**
   * @param {string} title
   * @param {number} startTime
   */
  setActivity (title, startTime) {
    if (title === this.activityTitle && startTime === this.activityStartTime) {
      return;
    }

    this.activityTitle = title;
    this.activityStartTime = startTime;

    // The first time we receive a valid title is when automatic connection is possible.
    if (this.activityTitle) {
      this.checkAutomaticEnable();
    }

    if (this.canWrite() && !this.activityTimeout) {
      this.writeActivity();
      this.scheduleNextWriteActivity();
    }
  }

  /**
   * @private
   */
  scheduleNextWriteActivity () {
    const oldTitle = this.activityTitle;
    const oldStartTime = this.activityStartTime;

    // The update activity function in Discord's Game SDK rate limits to 5 updates
    // per 20 seconds. We roughly follow that.
    // https://github.com/discord/discord-api-docs/blob/main/docs/game_sdk/Activities.md#updateactivity
    this.activityTimeout = setTimeout(() => {
      if (this.activityTitle !== oldTitle || this.activityStartTime !== oldStartTime) {
        this.writeActivity();
        this.scheduleNextWriteActivity();
      } else {
        this.activityTimeout = null;
      }
    }, 4000);
  }

  /**
   * @private
   */
  writeActivity () {
    const title = this.activityTitle || translate('rich-presence.untitled');
    this.write(OP_FRAME, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          // Needs to be at least 2 characters long and not more than 128, otherwise it is rejected
          details: title.padEnd(2, ' ').substring(0, 128),
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

module.exports = new RichPresence();
