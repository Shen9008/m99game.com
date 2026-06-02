'use strict';

const BLOG_DEFAULT_PNG = '/images/blog-default.png';
const BLOG_DEFAULT_WEBP = '/images/webp/blog-default.webp';

/**
 * Extracts a URL from Strapi media (string, { url }, or { data: { attributes } }).
 * @param {unknown} raw
 * @returns {string}
 */
function extractMediaUrl(raw) {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw !== 'object') return '';

  if (typeof raw.url === 'string') return raw.url.trim();

  const nested = raw.data;
  if (nested && typeof nested === 'object') {
    const attrs = nested.attributes || nested;
    if (attrs && typeof attrs.url === 'string') return attrs.url.trim();
  }

  return '';
}

/**
 * @param {string} url
 * @returns {string}
 */
function normalizeImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
  return `/${url.replace(/^\/+/, '')}`;
}

/**
 * Resolves post image: CMS `image` (and common aliases) or site default.
 * @param {object} post
 * @returns {string}
 */
function resolvePostImage(post = {}) {
  const fields = [post.image, post.featured_image, post.cover_image, post.thumbnail];
  for (const field of fields) {
    const url = normalizeImageUrl(extractMediaUrl(field));
    if (url) return url;
  }
  return BLOG_DEFAULT_PNG;
}

/**
 * Local /images/*.png|jpg → matching flat webp under /images/webp/ (build-webp naming).
 * @param {string} src
 * @returns {string} webp src or ''
 */
function webpSrcForLocalImage(src) {
  if (!src || !src.startsWith('/images/') || src.includes('/webp/')) return '';
  if (src === BLOG_DEFAULT_PNG) return BLOG_DEFAULT_WEBP;
  if (!/\.(png|jpe?g)$/i.test(src)) return '';

  const rel = src.replace(/^\/images\//, '').replace(/\.[^.]+$/i, '');
  const kebab = (s) =>
    s
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  if (!rel.includes('/')) {
    return `/images/webp/${kebab(rel)}.webp`;
  }

  const name = rel.split('/').map(kebab).filter(Boolean).join('-');
  return name ? `/images/webp/${name}.webp` : '';
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * @param {string} src
 * @param {string} alt
 * @param {{ className?: string, loading?: string }} [opts]
 * @returns {string}
 */
function buildPictureHtml(src, alt, opts = {}) {
  const webp = webpSrcForLocalImage(src);
  const classAttr = opts.className ? ` class="${escapeAttr(opts.className)}"` : '';
  const loading = opts.loading || 'lazy';
  const parts = [`<picture${classAttr}>`];
  if (webp) {
    parts.push(`<source type="image/webp" srcset="${escapeAttr(webp)}">`);
  }
  parts.push(
    `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="${escapeAttr(loading)}" decoding="async">`,
  );
  parts.push('</picture>');
  return parts.join('');
}

/**
 * Featured hero block for article pages.
 * @param {object} post - normalized post
 * @returns {string}
 */
function buildFeaturedMediaHtml(post) {
  const src = resolvePostImage(post);
  const alt = post.title || post.focus_keyword || 'M99Game article';
  return (
    `<div class="blog-featured blog-featured--image">` +
    buildPictureHtml(src, alt, { className: 'blog-featured__picture', loading: 'eager' }) +
    `</div>`
  );
}

module.exports = {
  BLOG_DEFAULT_PNG,
  BLOG_DEFAULT_WEBP,
  extractMediaUrl,
  resolvePostImage,
  webpSrcForLocalImage,
  buildPictureHtml,
  buildFeaturedMediaHtml,
};
