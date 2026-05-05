/**
 * Blog index: paginated cards from /assets/data/blogs.json (6 per page, 3-column grid on wide viewports).
 */
(function () {
  'use strict';

  var PER_PAGE = 6;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatBlogDate(iso) {
    if (!iso) return '';
    try {
      var x = new Date(iso);
      if (isNaN(x.getTime())) return '';
      return x.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  }

  function parsePageFromUrl() {
    var p = parseInt(new URLSearchParams(location.search).get('page') || '1', 10);
    if (isNaN(p) || p < 1) return 1;
    return p;
  }

  function syncUrlPage(page) {
    var url = new URL(location.href);
    if (page <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    history.pushState({ blogPage: page }, '', url);
  }

  function pageWindow(current, total) {
    if (total <= 7) {
      var all = [];
      for (var j = 1; j <= total; j++) all.push(j);
      return all;
    }
    var start = Math.max(1, current - 2);
    var end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    var arr = [];
    for (var k = start; k <= end; k++) arr.push(k);
    return arr;
  }

  function buildCardHtml(b) {
    var gradient =
      b.placeholder_gradient ||
      'linear-gradient(135deg, var(--m99-gold-dim) 0%, var(--m99-gold) 45%, var(--m99-mint) 100%)';
    var kw = b.focus_keyword || b.title || '';
    var dateStr = formatBlogDate(b.published_date);
    var meta = [dateStr, b.category, b.reading_time].filter(Boolean).join(' · ');
    return (
      '<a class="blog-card" href="/blog/' +
      esc(b.slug) +
      '/">' +
      '<div class="blog-card__media" aria-hidden="true">' +
      '<div class="blog-card__gradient" style="background:' +
      gradient +
      '">' +
      '<span class="blog-card__gradient-text">' +
      esc(kw) +
      '</span>' +
      '</div>' +
      '</div>' +
      '<div class="blog-card__body">' +
      '<h2 class="blog-card__title">' +
      esc(b.title || b.slug) +
      '</h2>' +
      (meta ? '<div class="blog-card__meta">' + esc(meta) + '</div>' : '') +
      '<p class="blog-card__excerpt">' +
      esc(b.excerpt || b.meta_description || '') +
      '</p>' +
      '<span class="blog-card__cta">Read article</span>' +
      '</div>' +
      '</a>'
    );
  }

  function paginationHtml(current, totalPages) {
    if (totalPages <= 1) return '';
    var nums = pageWindow(current, totalPages);
    var parts = [];
    parts.push('<nav class="blog-pagination" aria-label="Blog articles pagination">');
    parts.push('<div class="blog-pagination__inner">');
    parts.push(
      '<button type="button" class="blog-pagination__btn blog-pagination__prev" data-blog-page="' +
        (current - 1) +
        '"' +
        (current <= 1 ? ' disabled' : '') +
        '>Previous</button>',
    );
    parts.push('<ul class="blog-pagination__list">');
    for (var i = 0; i < nums.length; i++) {
      var n = nums[i];
      var isActive = n === current;
      parts.push(
        '<li><button type="button" class="blog-pagination__page' +
          (isActive ? ' is-active' : '') +
          '" data-blog-page="' +
          n +
          '"' +
          (isActive ? ' aria-current="page"' : '') +
          '>' +
          n +
          '</button></li>',
      );
    }
    parts.push('</ul>');
    parts.push(
      '<button type="button" class="blog-pagination__btn blog-pagination__next" data-blog-page="' +
        (current + 1) +
        '"' +
        (current >= totalPages ? ' disabled' : '') +
        '>Next</button>',
    );
    parts.push('</div></nav>');
    return parts.join('');
  }

  function render(root, sorted, page) {
    var total = sorted.length;
    var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    page = Math.min(Math.max(1, page), totalPages);
    var startIdx = (page - 1) * PER_PAGE;
    var slice = sorted.slice(startIdx, startIdx + PER_PAGE);
    var startN = total === 0 ? 0 : startIdx + 1;
    var endN = startIdx + slice.length;

    var rangeText =
      total === 0
        ? 'No articles'
        : 'Showing ' + startN + '–' + endN + ' of ' + total + ' articles';

    var html =
      '<div class="blog-listing">' +
      '<p class="blog-listing__range">' +
      esc(rangeText) +
      '</p>' +
      '<div class="blog-card-grid blog-card-grid--paged">' +
      slice.map(buildCardHtml).join('') +
      '</div>' +
      paginationHtml(page, totalPages) +
      '</div>';

    root.innerHTML = html;
  }

  function run() {
    var root = document.getElementById('blog-card-root');
    if (!root) return;

    fetch('/assets/data/blogs.json')
      .then(function (r) {
        if (!r.ok) throw new Error('blogs.json');
        return r.json();
      })
      .then(function (blogs) {
        if (!Array.isArray(blogs) || blogs.length === 0) {
          root.innerHTML =
            '<p class="blog-empty">New guides are on the way. Check back soon.</p>';
          return;
        }

        var sorted = blogs.slice().sort(function (a, b) {
          var tb = new Date(b.synced_at || b.published_date || 0).getTime();
          var ta = new Date(a.synced_at || a.published_date || 0).getTime();
          if (tb !== ta) return tb - ta;
          return String(b.slug).localeCompare(String(a.slug));
        });

        root.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-blog-page]');
          if (!btn || btn.disabled) return;
          e.preventDefault();
          var p = parseInt(btn.getAttribute('data-blog-page'), 10);
          if (isNaN(p)) return;
          var totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
          p = Math.min(Math.max(1, p), totalPages);
          syncUrlPage(p);
          render(root, sorted, p);
          var listing = root.querySelector('.blog-listing');
          if (listing) {
            listing.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });

        window.addEventListener('popstate', function () {
          render(root, sorted, parsePageFromUrl());
        });

        var totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
        var fromUrl = parsePageFromUrl();
        var initial = Math.min(Math.max(1, fromUrl), totalPages);
        if (initial !== fromUrl) {
          var fixUrl = new URL(location.href);
          if (initial <= 1) fixUrl.searchParams.delete('page');
          else fixUrl.searchParams.set('page', String(initial));
          history.replaceState({ blogPage: initial }, '', fixUrl);
        }
        render(root, sorted, initial);
      })
      .catch(function () {
        root.innerHTML =
          '<p class="blog-empty">Could not load articles. Please try again later.</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else run();
})();
