import React from 'react';
import ReactDOM from 'react-dom';

import styles from './privacy.css';

ReactDOM.render((
  // Please make sure privacy.html is always the same as this.
  <main>
    <h1>Privacy Policy</h1>
    <p><i>Updated February 14th, 2021</i></p>
    <p>The app does not collect any information about you or your use of the app.</p>
    <p>The app may make requests to check for updates. These requests are not logged. This is an important security feature that cannot be disabled.</p>
    <p>Any concerns related to privacy or any other matter should be sent to: <a href="mailto:contact@turbowarp.org">contact@turbowarp.org</a></p>
  </main>
), require('../app-target'));
