/**
 * Hydrates blog article sidebar + related posts from /assets/data/blogs.json
 */
(function () {
  'use strict';

  var SIDEBAR_RECENT_COUNT = 3;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function loadJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + url);
      return r.json();
    });
  }

  function run() {
    var slug = document.body.getAttribute('data-blog-slug') || '';
    var relatedRaw = document.body.getAttribute('data-related-slugs') || '';
    var relatedSlugs = relatedRaw.split(',').map(function (s) {
      return s.trim();
    }).filter(Boolean);

    var sidebarEl = document.getElementById('sidebar-posts');
    var relatedSection = document.getElementById('related-posts');
    if (!sidebarEl && !relatedSection) return;

    loadJson('/assets/data/blogs.json')
      .then(function (blogs) {
        if (!Array.isArray(blogs)) blogs = [];

        var bySlug = {};
        blogs.forEach(function (b) {
          if (b && b.slug) bySlug[b.slug] = b;
        });

        if (sidebarEl) {
          var recent = blogs
            .filter(function (b) {
              return b.slug && b.slug !== slug;
            })
            .sort(function (a, b) {
              var tb = new Date(b.synced_at || b.published_date || 0).getTime();
              var ta = new Date(a.synced_at || a.published_date || 0).getTime();
              if (tb !== ta) return tb - ta;
              return String(b.slug).localeCompare(String(a.slug));
            })
            .slice(0, SIDEBAR_RECENT_COUNT);

          if (recent.length === 0) {
            sidebarEl.innerHTML = '<li class="blog-sidebar-placeholder">No other posts yet.</li>';
          } else {
            sidebarEl.innerHTML = recent
              .map(function (b) {
                return (
                  '<li><a href="/blog/' +
                  esc(b.slug) +
                  '/">' +
                  esc(b.title || b.slug) +
                  '</a></li>'
                );
              })
              .join('');
          }
        }

        if (relatedSection) {
          var placeholder = relatedSection.querySelector('.blog-related-placeholder');
          var listEl = relatedSection.querySelector('.blog-related-list');

          var related = relatedSlugs
            .map(function (s) {
              return bySlug[s];
            })
            .filter(Boolean);

          if (!listEl) return;

          if (related.length === 0) {
            if (placeholder) {
              placeholder.textContent = 'More guides coming soon.';
            }
            listEl.hidden = true;
          } else {
            if (placeholder) placeholder.hidden = true;
            listEl.hidden = false;
            listEl.innerHTML = related
              .map(function (b) {
                return (
                  '<li><a href="/blog/' +
                  esc(b.slug) +
                  '/">' +
                  esc(b.title || b.slug) +
                  '</a></li>'
                );
              })
              .join('');
          }
        }
      })
      .catch(function () {
        if (sidebarEl) {
          sidebarEl.innerHTML =
            '<li class="blog-sidebar-placeholder">Could not load post list.</li>';
        }
        var placeholder = relatedSection && relatedSection.querySelector('.blog-related-placeholder');
        if (placeholder) placeholder.textContent = 'Could not load related posts.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else run();
})();
