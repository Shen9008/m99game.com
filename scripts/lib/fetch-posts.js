'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

const API_BASE = process.env.STRAPI_API_URL || 'http://localhost:1337/api';
const API_TOKEN = process.env.STRAPI_API_TOKEN;
const SITE_DOMAIN = process.env.SITE_DOMAIN || process.env.site_domain;

const DEFAULT_FILTER_KEY = 'filters[site][domain][$eq]';

/**
 * Resolved config for GET {base}/{collection} (used by sync + doctor).
 * @param {object} [opts]
 * @param {string} [opts.baseUrl]
 * @param {string} [opts.siteDomain] - override SITE_DOMAIN for this fetch only
 */
function getPostsSyncConfig(opts = {}) {
  const base = String(opts.baseUrl || API_BASE).replace(/\/$/, '');
  const collection = String(process.env.POSTS_COLLECTION || 'posts')
    .trim()
    .replace(/^\/+/, '')
    .split('/')[0]
    .replace(/\/+$/, '');
  const siteDomain = String(opts.siteDomain !== undefined ? opts.siteDomain : SITE_DOMAIN || '')
    .trim();
  const skipFilter = /^1|true|yes$/i.test(String(process.env.SKIP_POSTS_SITE_FILTER || '').trim());

  const rawKey = process.env.POSTS_SITE_FILTER_KEY;
  let filterKey;
  if (rawKey === undefined || rawKey === null) {
    filterKey = DEFAULT_FILTER_KEY;
  } else {
    filterKey = String(rawKey).trim() || DEFAULT_FILTER_KEY;
  }

  const applySiteFilter = Boolean(siteDomain && !skipFilter && filterKey);

  return {
    base,
    collection,
    siteDomain,
    skipFilter,
    filterKey,
    applySiteFilter,
    endpoint: `${base}/${collection}`,
  };
}

/**
 * Build a sample URL for tooling / docs (page 1 by default).
 * @param {object} cfg - from getPostsSyncConfig()
 * @param {number} [page]
 */
function buildSamplePostsUrl(cfg, page = 1) {
  const url = new URL(cfg.endpoint);
  if (cfg.applySiteFilter) {
    url.searchParams.set(cfg.filterKey, cfg.siteDomain);
  }
  url.searchParams.set('sort', 'publishedAt:asc');
  url.searchParams.set('pagination[page]', String(page));
  url.searchParams.set('pagination[pageSize]', '100');
  return url.toString();
}

/**
 * Fetches all published posts from Strapi REST `{base}/{POSTS_COLLECTION}`.
 * Optional site filter via POSTS_SITE_FILTER_KEY + SITE_DOMAIN unless SKIP_POSTS_SITE_FILTER is set.
 * @param {object} [opts]
 * @param {string} [opts.baseUrl]
 * @param {string} [opts.siteDomain]
 * @returns {Promise<Array>} Normalised post objects
 */
async function fetchPosts(opts = {}) {
  const cfg = getPostsSyncConfig(opts);
  const allPosts = [];
  let page = 1;
  const pageSize = 100;

  if (!cfg.siteDomain && !cfg.skipFilter) {
    console.warn('fetch-posts: SITE_DOMAIN / site_domain not set; request is unfiltered by site.');
  }

  const headers = {};
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  while (true) {
    const url = new URL(cfg.endpoint);
    if (cfg.applySiteFilter) {
      url.searchParams.set(cfg.filterKey, cfg.siteDomain);
    }
    url.searchParams.set('sort', 'publishedAt:asc');
    url.searchParams.set('pagination[page]', String(page));
    url.searchParams.set('pagination[pageSize]', String(pageSize));

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const raw = Array.isArray(data) ? data : (data.data || []);
    const posts = Array.isArray(raw) ? raw : [raw];

    for (const p of posts) {
      if (!p || typeof p !== 'object') continue;
      const attrs = p.attributes || p;
      allPosts.push({ id: p.id, ...attrs });
    }

    const pagination = data.meta?.pagination || data.pagination;
    if (!pagination || page >= (pagination.pageCount || 1)) break;
    page++;
  }

  return allPosts;
}

/**
 * When SYNC_REQUIRE_SITE_FILTER=1, fail if site filter would not be applied.
 * @param {object} cfg - from getPostsSyncConfig()
 */
function assertSiteFilterRequired(cfg) {
  const required = /^1|true|yes$/i.test(String(process.env.SYNC_REQUIRE_SITE_FILTER || '').trim());
  if (!required) return;

  if (!cfg.siteDomain) {
    throw new Error('SYNC_REQUIRE_SITE_FILTER=1 but SITE_DOMAIN is empty.');
  }
  if (cfg.skipFilter) {
    throw new Error('SYNC_REQUIRE_SITE_FILTER=1 but SKIP_POSTS_SITE_FILTER is enabled.');
  }
  if (!cfg.filterKey) {
    throw new Error('SYNC_REQUIRE_SITE_FILTER=1 but POSTS_SITE_FILTER_KEY is empty.');
  }
  if (!cfg.applySiteFilter) {
    throw new Error('SYNC_REQUIRE_SITE_FILTER=1 but site filter is not applied.');
  }
}

module.exports = {
  fetchPosts,
  getPostsSyncConfig,
  buildSamplePostsUrl,
  assertSiteFilterRequired,
};
