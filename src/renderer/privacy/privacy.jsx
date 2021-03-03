import React from 'react';
import ReactDOM from 'react-dom';

import styles from './privacy.css';

ReactDOM.render((
  // Please make sure privacy.html is always the same as this.
  <main>
    <h1>Privacy Policy</h1>
    <p><i>Updated March 2nd, 2021</i></p>
    <p>The app may make requests to check for updates. These requests are not logged.</p>
    <p>Some Scratch extensions (the ones with wifi icons) may make requests to Scratch. See the <a href="https://scratch.mit.edu/privacy_policy/" target="_blank" rel="noreferrer">Scratch privacy policy</a> for more information.</p>
    <p>The app does not contain any other form of telemetry.</p>
    <p>Any concerns related to privacy or any other matter should be sent to: <a href="mailto:contact@turbowarp.org">contact@turbowarp.org</a></p>
  </main>
), require('../app-target'));
