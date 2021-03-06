import './normalize.css';
import './prompt-impl';

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
