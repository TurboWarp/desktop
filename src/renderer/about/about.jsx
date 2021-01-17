import React from 'react';
import ReactDOM from 'react-dom';

import {version} from '../../../package.json';
import licenseText from '!!raw-loader!../../../LICENSE';
import styles from '../common.css';

ReactDOM.render((
  <main>
    <h1>TurboWarp Desktop v{version}</h1>
    <p>
      <a href="https://desktop.turbowarp.org" target="_blank" rel="noreferrer">https://desktop.turbowarp.org</a>
      &nbsp;Electron {process.versions.electron}, Chrome {process.versions.chrome}
    </p>
    <h2>License</h2>
    <pre>{licenseText}</pre>
  </main>
), require('../app-target'));
