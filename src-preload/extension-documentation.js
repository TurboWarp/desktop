/**
 * @param {string} selector
 * @returns {Promise<Element>}
 */
const waitForElement = (selector) => new Promise(resolve => {
  let element = document.querySelector(selector);
  if (element) {
    resolve(element);
    return;
  }

  const observer = new MutationObserver(() => {
    element = document.querySelector(selector);
    if (element) {
      resolve(element);
      observer.disconnect();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
});

// DOMContentLoaded fires too late and would cause layout shift.
waitForElement('html').then(html => {
  html.classList.add('is-desktop');
});
