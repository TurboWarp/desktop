import React from 'react';
import ReactDOM from 'react-dom';

import styles from './privacy.css';

ReactDOM.render((
  // Please make sure privacy.html is always the same as this.
  <main>
    <h1>Privacy Policy</h1>
    <p><i>Updated September 29th, 2021</i></p>
    <p>The app may make requests to check for updates. These requests are not logged.</p>
    <p>Scratch extensions that require Wi-Fi (such as Translate, Text to Speech, LEGO, micro:bit, etc.) may connect to the Scratch API to implement these features. <a href="https://scratch.mit.edu/privacy_policy/">Refer to the Scratch privacy policy for more information</a>. The Translate extension may instead make requests to a TurboWarp API, which may then forward your request to the Scratch API and log the message being translated and the result for caching and performance.</p>
    <p>Any concerns related to privacy or any other matter should be sent to: <a href="mailto:contact@turbowarp.org">contact@turbowarp.org</a></p>
  </main>
), require('../app-target'));
