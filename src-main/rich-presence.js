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

// https://discord.com/developers
// ask garbomuffin for changes
const APPLICATION_ID = '1243008354037665813';

const HANDSHAKE = 0;
const FRAME = 1;
const CLOSE = 2;
const PING = 3;
const PONG = 4;

const uuid4122 = () => {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    let n;
    if (i === 12) {
      n = 4;
    } else {
      const random = Math.random() * 16 | 0;
      if (i === 16) {
        n = (random & 3) | 0;
      } else {
        n = random;
      }
    }
    uuid += n.toString(16);
  }
  return uuid;
};

class IPC {
  constructor () {
    /** @type {Buffer} */
    this.buffer = Buffer.alloc(0);

    /** @type {net.Socket|null} */
    this.socket = null;

    this.connect();
  }

  /**
   * @param {number} i
   * @returns {string[]}
   */
  getSocketPaths (i) {
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
  }

  /**
   * @param {string} path
   * @returns {Promise<net.Socket>}
   */
  tryOpenSocket (path) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(path, () => {
        resolve(socket);
      });
      socket.on('error', (err) => {
        reject(err);
      });
      socket.on('timeout', () => {
        reject(new Error('Timed out'));
      });
      socket.setTimeout(10000);
    });
  }

  /**
   * @returns {Promise<net.Socket>}
   */
  async findIPCSocket () {
    for (let i = 0; i < 10; i++) {
      for (const path of this.getSocketPaths(i)) {
        console.log('trying', path);
        try {
          return await this.tryOpenSocket(path)
        } catch (e) {
          // keep trying the next one
          console.error(e);
        }
      }
    }

    throw new Error('Could not open IPC');
  }
  
  async connect () {
    this.socket = await this.findIPCSocket();
    this.socket.on('data', (data) => {
      this.handleSocketData(data)
    });
    this.socket.on('close', () => {
      this.socket = null;
    });
    this.write(HANDSHAKE, {
      v: 1,
      client_id: APPLICATION_ID
    });
  }

  close () {
    if (this.socket) {
      this.write(CLOSE, {
        v: 1,
        client_id: APPLICATION_ID
      });
    }

    this.socket = null;
    this.buffer = Buffer.alloc(0);
  }

  /**
   * @param {number} op See constants
   * @param {unknown} data Object to be JSON.stringify()'d
   */
  write (op, data) {
    if (!this.socket) {
      throw new Error('Not connected');
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
   * @param {Buffer} data
   */
  handleSocketData (data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    this.tryDecodeData();
  }

  tryDecodeData () {
    if (this.buffer.byteLength < 8) {
      // Missing header.
      return;
    }

    const op = this.buffer.readUint32LE(0);
    const length = this.buffer.readUint32LE(4);

    if (this.buffer.byteLength < 8 + length) {
      // Missing the full payload.
      return;
    }

    const payload = this.buffer.subarray(8, 8 + length);
    try {
      const parsedPayload = JSON.parse(payload.toString('utf-8'));
      this.handleMessage(op, parsedPayload);
    } catch (e) {
      console.error('error decoding rich presence', e);
    }

    // Regardless of success or failure, discard the packet
    this.buffer = this.buffer.subarray(8 + length);

    // Might be another packet
    this.tryDecodeData();
  }

  /**
   * @param {number} op See constants
   * @param {unknown} data Parsed JSON object
   */
  handleMessage (op, data) {
    console.log('received', op, data);
  
    if (op === PING) {
      this.write(PONG, data);
      return;
    }

    if (op === CLOSE) {
      this.socket = null;
      return;
    }

    if (op === FRAME) {
      if (data.evt === 'READY') {
        this.handleReady();
      }

      return;
    }
  }

  handleReady () {
    this.write(FRAME, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          details: 'test 123',
          assets: {
            large_image: 'logo-v2',
            large_text: 'Test 123'
          },
          instance: false 
        }
      },
      nonce: uuid4122()
    });
  }
}

const ipc = new IPC();

module.exports = {
  setActivity: () => {}
};
