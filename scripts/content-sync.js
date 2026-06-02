'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { fetchPosts, getPostsSyncConfig, assertSiteFilterRequired } = require('./lib/fetch-posts.js');
const { normalizePost, validatePost } = require('./lib/normalize-post.js');
const { renderArticle } = require('./lib/render-article.js');
const { generateSitemap } = require('./lib/generate-sitemap.js');

const ROOT = path.resolve(__dirname, '..');
const BLOGS_JSON_PATH = path.join(ROOT, 'assets/data/blogs.json');

const BLOGS_JSON_FIELDS = [
  'slug', 'title', 'meta_title', 'meta_description', 'focus_keyword',
  'category', 'search_intent', 'published_date', 'reading_time',
  'excerpt', 'placeholder_gradient', 'image', 'related_posts', 'keywords',
];

function toBlogsEntry(normalized) {
  const entry = {};
  for (const k of BLOGS_JSON_FIELDS) {
    if (normalized[k] !== undefined) entry[k] = normalized[k];
  }
  return entry;
}

function getSlug(raw) {
  return raw.slug || raw.documentId || '';
}

function hashContent(content) {
  const raw = content == null ? '' : (typeof content === 'string' ? content : JSON.stringify(content));
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function getCmsUpdatedAt(raw) {
  return raw.updatedAt || raw.publishedAt || '';
}

function postNeedsRefresh(existing, raw, force) {
  if (force) return true;
  const newHash = hashContent(raw.content);
  const newCms = getCmsUpdatedAt(raw);
  return existing.content_hash !== newHash || existing.cms_updated_at !== newCms;
}

/** Sort blogs.json: synced_at desc → published_date desc → cms_updated_at desc → slug desc. */
function sortBlogs(blogs) {
  return blogs.slice().sort((a, b) => {
    const hasSyncedA = Boolean(a.synced_at);
    const hasSyncedB = Boolean(b.synced_at);
    if (hasSyncedA && !hasSyncedB) return -1;
    if (!hasSyncedA && hasSyncedB) return 1;

    if (hasSyncedA && hasSyncedB) {
      const tb = new Date(b.synced_at).getTime();
      const ta = new Date(a.synced_at).getTime();
      if (tb !== ta) return tb - ta;
    }

    const pb = new Date(b.published_date || 0).getTime();
    const pa = new Date(a.published_date || 0).getTime();
    if (pb !== pa) return pb - pa;

    const cb = new Date(b.cms_updated_at || 0).getTime();
    const ca = new Date(a.cms_updated_at || 0).getTime();
    if (cb !== ca) return cb - ca;

    return String(b.slug).localeCompare(String(a.slug));
  });
}

function getRelatedSlugs(blogs, currentSlug, opts = {}, limit = 3) {
  const searchIntent = (opts.searchIntent || 'informational').toLowerCase();
  const category = (opts.category || '').toLowerCase();
  const others = blogs.filter((b) => b.slug !== currentSlug);
  const byDate = (a, b) => {
    const tb = new Date(b.synced_at || b.published_date || 0).getTime();
    const ta = new Date(a.synced_at || a.published_date || 0).getTime();
    if (tb !== ta) return tb - ta;
    return String(b.slug).localeCompare(String(a.slug));
  };

  const sameIntent = others.filter((b) => (b.search_intent || '').toLowerCase() === searchIntent).sort(byDate);
  const sameIntentSlugs = new Set(sameIntent.map((b) => b.slug));
  const sameCategory = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && category && (b.category || '').toLowerCase() === category)
    .sort(byDate);
  const sameCategorySlugs = new Set(sameCategory.map((b) => b.slug));
  const rest = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && !sameCategorySlugs.has(b.slug))
    .sort(byDate);

  const merged = [...sameIntent, ...sameCategory, ...rest];
  return merged.slice(0, limit).map((b) => b.slug);
}

function loadBlogsJson() {
  try {
    const raw = fs.readFileSync(BLOGS_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBlogsJson(blogs) {
  const json = JSON.stringify(sortBlogs(blogs), null, 2);
  fs.writeFileSync(BLOGS_JSON_PATH, json + '\n', 'utf8');
}

function parseLimit(argv) {
  const idx = argv.indexOf('--limit');
  if (idx === -1 || idx + 1 >= argv.length) return Infinity;
  const n = parseInt(argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

function buildWorklist(strapiPosts, existingBySlug, opts) {
  const { isDaily, isRefresh, isForce, isAll, limit } = opts;

  const newPosts = strapiPosts
    .filter((p) => {
      const slug = getSlug(p);
      return slug && !existingBySlug.has(slug);
    })
    .sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));

  const changedExisting = strapiPosts.filter((p) => {
    const slug = getSlug(p);
    const existing = existingBySlug.get(slug);
    return existing && postNeedsRefresh(existing, p, isForce);
  });

  let toCreate = [];
  let toRefresh = [];

  if (isForce) {
    toCreate = newPosts;
    toRefresh = strapiPosts.filter((p) => {
      const slug = getSlug(p);
      return slug && existingBySlug.has(slug);
    });
  } else if (isDaily) {
    toCreate = newPosts.slice(0, 1);
    toRefresh = changedExisting;
  } else if (isRefresh) {
    toCreate = newPosts;
    toRefresh = changedExisting;
  } else if (isAll) {
    toCreate = newPosts;
  } else {
    toCreate = newPosts.slice(0, 1);
  }

  if (Number.isFinite(limit)) {
    toCreate = toCreate.slice(0, limit);
  }

  const createSlugs = new Set(toCreate.map(getSlug));
  const worklist = [
    ...toCreate.map((raw) => ({ raw, action: 'create' })),
    ...toRefresh
      .filter((raw) => !createSlugs.has(getSlug(raw)))
      .map((raw) => ({ raw, action: 'refresh' })),
  ];

  return worklist;
}

function upsertBlog(blogs, entry) {
  const idx = blogs.findIndex((b) => b.slug === entry.slug);
  if (idx >= 0) {
    blogs[idx] = entry;
  } else {
    blogs.push(entry);
  }
}

function buildEntry(normalized, raw) {
  const entry = toBlogsEntry(normalized);
  entry.synced_at = new Date().toISOString();
  entry.content_hash = hashContent(raw.content);
  entry.cms_updated_at = getCmsUpdatedAt(raw) || entry.synced_at;
  return entry;
}

async function run() {
  const argv = process.argv.slice(2);
  const isDaily = argv.includes('--daily');
  const isRefresh = argv.includes('--refresh');
  const isForce = argv.includes('--force');
  const isAll = argv.includes('--all');
  const limit = parseLimit(argv);
  const apiUrl = process.env.STRAPI_API_URL || 'http://localhost:1337/api';

  assertSiteFilterRequired(getPostsSyncConfig({ baseUrl: apiUrl }));

  console.log('Fetching posts from API...');
  const strapiPosts = await fetchPosts({ baseUrl: apiUrl });

  const existingBlogs = loadBlogsJson();
  const existingBySlug = new Map(existingBlogs.map((b) => [b.slug, b]));

  const worklist = buildWorklist(strapiPosts, existingBySlug, {
    isDaily,
    isRefresh,
    isForce,
    isAll,
    limit,
  });

  if (worklist.length === 0) {
    console.log('No articles to publish or refresh.');
    return;
  }

  const creates = worklist.filter((w) => w.action === 'create').length;
  const refreshes = worklist.filter((w) => w.action === 'refresh').length;
  console.log(`Processing ${worklist.length} article(s) (${creates} new, ${refreshes} refresh)...`);

  let blogs = [...existingBlogs];

  for (const { raw, action } of worklist) {
    const slug = getSlug(raw);
    const related = getRelatedSlugs(blogs, slug, {
      searchIntent: raw.search_intent,
      category: raw.category,
    });

    const normalized = normalizePost(raw, { relatedPosts: related });
    validatePost(normalized);

    const label = action === 'create' ? 'publish' : 'refresh';
    console.log(`  - [${label}] ${normalized.title} (${slug})`);
    renderArticle(normalized, { blogs });

    upsertBlog(blogs, buildEntry(normalized, raw));
  }

  saveBlogsJson(blogs);
  generateSitemap();
  console.log('Done. blogs.json and sitemap.xml updated.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
