import React from 'react';
import ReactDOM from 'react-dom';

import {version} from '../../../package.json';
import licenseText from '!!raw-loader!../../../LICENSE';
import styles from './about.css';

// TWD is set by preload.js
const {extra, electron} = TWD.versions;

const info = [];
info.push(`v${version}`);
if (extra) info.push(extra);
info.push(`Electron v${electron}`);

ReactDOM.render((
  <main>
    <h1>TurboWarp Desktop v{version}</h1>
    <p><i>(Debug info: {info.join(', ')})</i></p>
    <p>TurboWarp is a mod of Scratch with a compiler and more features. TurboWarp is not affiliated with Scratch, the Scratch Team, or the Scratch Foundation. Learn more at <a href="https://desktop.turbowarp.org" target="_blank" rel="noreferrer">https://desktop.turbowarp.org</a>.</p>
    <p>TurboWarp Desktop is licensed under the GNU General Public License v3.0. The source code is published <a href="https://github.com/TurboWarp/" target="_blank" rel="noreferrer">on GitHub</a>. You can read the license below:</p>
    <pre>{licenseText}</pre>
  </main>
), require('../app-target'));
