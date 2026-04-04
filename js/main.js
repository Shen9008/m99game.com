/**
 * M99Game — FAQ accordion, tabs, scroll reveals, stat counters, footer year.
 */
(function () {
  'use strict';

  function year() {
    var el = document.getElementById('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function faq() {
    document.querySelectorAll('.faq-item__q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function tabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (root) {
      var buttons = root.querySelectorAll('.tabs__btn');
      var panels = root.querySelectorAll('.tab-panel');
      buttons.forEach(function (b, i) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-tab');
          buttons.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
          b.setAttribute('aria-selected', 'true');
          panels.forEach(function (p) {
            var on = p.getAttribute('id') === id;
            p.classList.toggle('is-active', on);
            p.hidden = !on;
          });
        });
        if (i === 0) b.setAttribute('aria-selected', 'true');
      });
      panels.forEach(function (p, idx) {
        p.hidden = idx !== 0;
      });
    });
  }

  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  function animateStats() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 900;
        var start = 0;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var val = Math.floor(start + (target - start) * (0.5 - Math.cos(Math.PI * p) / 2));
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        el.classList.add('is-counting');
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  function init() {
    year();
    faq();
    tabs();
    reveal();
    animateStats();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

