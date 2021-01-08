require('./update-checker');
require('./filesystem-api-impl');
require('./prompt-impl');

const React = require('react');
const ReactDOM = require('react-dom');

const GUI = require('./gui.jsx').default;

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMedia.onchange = () => document.body.setAttribute('theme', darkModeMedia.matches ? 'dark' : 'light');
darkModeMedia.onchange();

const target = document.getElementById('app');
target.style.position = 'absolute';
target.style.top = '0';
target.style.left = '0';
target.style.width = '100%';
target.style.height = '100%';

ReactDOM.render(React.createElement(GUI, {}, null), target);

document.body.classList.add('tw-loaded');
