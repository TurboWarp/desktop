import React from 'react';
import ReactDOM from 'react-dom';
import GUI from './gui.jsx';

import './filesystem-api-impl.js';
import './media-device-chooser-impl.js';
import '../browser-prompt-reimplementation.js';

const appTarget = document.getElementById('app');
document.body.classList.add('tw-loaded');
GUI.setAppElement(appTarget);

ReactDOM.render(<GUI />, appTarget);

require('./addons');
