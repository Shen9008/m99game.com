/**
 * M99Game — inject shared chrome (header, footer, optional CTA) + SVG sprite.
 */
(function () {
  'use strict';

  function spriteHtml() {
    var symbols =
      '<symbol id="icon-menu" viewBox="0 0 24 24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></symbol>' +
      '<symbol id="icon-close" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></symbol>' +
      '<symbol id="icon-chevron" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></symbol>' +
      '<symbol id="icon-slot" viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM8 8h2v2H8V8zm4 0h2v2h-2V8zm4 0h2v2h-2V8zM8 12h8v2H8v-2z"/></symbol>' +
      '<symbol id="icon-card" viewBox="0 0 24 24"><path fill="currentColor" d="M4 6h16v12H4V6zm2 2v8h12V8H6zm3 3h6v2H9v-2z"/></symbol>' +
      '<symbol id="icon-chip" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/></symbol>' +
      '<symbol id="icon-gift" viewBox="0 0 24 24"><path fill="currentColor" d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.66 0-3 1.34-3 3H12c0-1.66-1.34-3-3-3S6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-2V5h2zm-6 0c.55 0 1 .45 1 1s-.45 1-1 1H8V5h1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 9.17l1 1.36 3-3.36H20v5z"/></symbol>' +
      '<symbol id="icon-shield" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></symbol>' +
      '<symbol id="icon-wallet" viewBox="0 0 24 24"><path fill="currentColor" d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28A2 2 0 0 0 22 15V9a2 2 0 0 0-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z"/><circle fill="currentColor" cx="16" cy="12" r="1.5"/></symbol>' +
      '<symbol id="icon-headset" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z"/></symbol>' +
      '<symbol id="icon-bolt" viewBox="0 0 24 24"><path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/></symbol>';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
      '<defs>' + symbols + '</defs></svg>'
    );
  }

  function setActiveNav() {
    var page = document.body.getAttribute('data-page') || '';
    if (!page) return;
    document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (el) {
      el.classList.add('nav__link--active', 'mobile-menu__link--active');
    });
  }

  function injectHeader(html) {
    var ph = document.getElementById('partial-header');
    if (!ph) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var parent = ph.parentNode;
    while (wrap.firstChild) parent.insertBefore(wrap.firstChild, ph);
    ph.remove();
  }

  function injectFooter(html) {
    var ph = document.getElementById('partial-footer');
    if (ph) ph.outerHTML = html;
  }

  function injectCta(html) {
    var ph = document.getElementById('partial-cta');
    if (!ph || document.body.getAttribute('data-no-cta') === 'true') return;
    ph.outerHTML = html;
  }

  function wireMobileMenu() {
    var toggle = document.querySelector('.mobile-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('active');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      var use = toggle.querySelector('use');
      if (use) use.setAttribute('href', open ? '#icon-close' : '#icon-menu');
    });
  }

  function run() {
    document.body.insertAdjacentHTML('afterbegin', spriteHtml());
    Promise.all([
      fetch('partials/header.html').then(function (r) { return r.text(); }),
      fetch('partials/footer.html').then(function (r) { return r.text(); }),
      fetch('partials/cta-banner.html').then(function (r) { return r.text(); })
    ])
      .then(function (parts) {
        injectHeader(parts[0]);
        injectFooter(parts[1]);
        injectCta(parts[2]);
        setActiveNav();
        wireMobileMenu();
        document.dispatchEvent(new CustomEvent('m99:partials-ready'));
      })
      .catch(function () {
        setActiveNav();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
