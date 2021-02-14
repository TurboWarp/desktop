import './normalize.css';

// Tricks some addon libraries into thinking they're not running in node
window.module = undefined;

const searchParams = new URLSearchParams(location.search);
const route = searchParams.get('route');

if (route === 'editor') {
  import('./gui/gui.jsx');
} else if (route === 'about') {
  import('./about/about.jsx');
} else if (route === 'settings') {
  import('./settings/settings.jsx');
} else if (route === 'privacy') {
  import('./privacy/privacy.jsx');
} else {
  alert(`Invalid route: ${route}`);
}
