const target = document.getElementById('app');
target.style.position = 'absolute';
target.style.top = '0';
target.style.left = '0';
target.style.width = '100%';
target.style.height = '100%';

document.body.classList.add('tw-loaded');

module.exports = target;
