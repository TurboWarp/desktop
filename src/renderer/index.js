const searchParams = new URLSearchParams(location.search);
const route = searchParams.get('route');

if (route === 'editor') {
  import('./gui/gui.jsx');
} else if (route === 'about') {
  import('./about/about.jsx');
} else {
  alert(`Invalid route: ${route}`);
}
