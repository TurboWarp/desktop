import React from 'react';
import ReactDOM from 'react-dom';

import AddonCredits from '../addon-credits.jsx';
import {version} from '../../../package.json';
import licenseText from '!!raw-loader!../../../LICENSE';
import addons from '../../addons/addons';
import styles from './about.css';

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
});

ReactDOM.render((
  <main>
    <h1>TurboWarp Desktop v{version}</h1>
    <p>
      <a href="https://desktop.turbowarp.org" target="_blank" rel="noreferrer">https://desktop.turbowarp.org</a>
      &nbsp;Electron {process.versions.electron}, Chrome {process.versions.chrome}
    </p>
    <h2>Addon Credits</h2>
    <ul>
      {addons.map((id) => {
        const manifest = require(`../../addons/addons/${id}/addon.json`);
        const name = manifest.name;
        return (
          <li key={id}>{name} by <AddonCredits manifest={manifest} /></li>
        );
      })}
    </ul>
    <h2>License</h2>
    <pre>{licenseText}</pre>
  </main>
), require('../app-target'));
