import React from 'react';
import ReactDOM from 'react-dom';

import {version} from '../../../package.json';
import licenseText from '!!raw-loader!../../../LICENSE';
import styles from './about.css';
import addons from '../../addons/addons.json';

ReactDOM.render((
  <div>
    <main>
      <h1>TurboWarp Desktop v{version}</h1>
      <p><a href="https://desktop.turbowarp.org" target="_blank" rel="noreferrer">https://desktop.turbowarp.org</a></p>
      <p>Electron {process.versions.electron}, Chrome {process.versions.chrome}</p>
      <details>
        <summary>License (GPLv3.0)</summary>
        <pre className={styles.licenseText}>{licenseText}</pre>
      </details>
      <details>
        <summary>Addon credits</summary>
        <p>All addons are licensed under the GPLv3.0 which can be read above.</p>
        <ul>
          {addons.map((id) => {
            if (id.startsWith('//')) return null;

            const manifest = require(`../../addons/addons/${id}/addon.json`);
            const name = manifest.name;
            const authors = manifest.credits ? manifest.credits.map((author, index) => {
              const isLast = index === manifest.credits.length - 1;
              return (
                <span key={index}>
                  <a href={author.link}>{author.name}</a>
                  {isLast ? null : ', '}
                </span>
              );
            }) : <span>unknown</span>;

            return (
              <li key={id}>{name} by {authors}</li>
            );
          })}
        </ul>
      </details>
    </main>
  </div>
), require('../app-target'));
