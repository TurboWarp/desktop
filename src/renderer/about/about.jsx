import React from 'react';
import ReactDOM from 'react-dom';

import {version} from '../../../package.json';
import licenseText from '!!raw-loader!../../../LICENSE';
import addons from '../../addons/addons.json';
import styles from './about.css';

ReactDOM.render((
  <div>
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
          const authors = manifest.credits ? manifest.credits.map((author, index) => {
            const isLast = index === manifest.credits.length - 1;
            return (
              <span key={index}>
                <a
                  href={author.link}
                  target="_blank"
                  rel="noreferrer"
                >
                  {author.name}
                </a>
                {isLast ? null : ', '}
              </span>
            );
          }) : <span>unknown</span>;

          return (
            <li key={id}>{name} by {authors}</li>
          );
        })}
      </ul>
      <h2>License</h2>
      <pre>{licenseText}</pre>
    </main>
  </div>
), require('../app-target'));
