'use strict';

const { getPostsSyncConfig, buildSamplePostsUrl, assertSiteFilterRequired } = require('./lib/fetch-posts.js');

const cfg = getPostsSyncConfig();
const strictFilter = /^1|true|yes$/i.test(String(process.env.SYNC_REQUIRE_SITE_FILTER || '').trim());

console.log('Posts sync — configuration (copy `scripts/` + env to reuse on other sites)\n');

console.log('  STRAPI_API_URL          ', cfg.base || '(unset)');
console.log('  POSTS_COLLECTION        ', cfg.collection);
console.log('  SITE_DOMAIN             ', cfg.siteDomain || '(unset)');
console.log('  SKIP_POSTS_SITE_FILTER  ', cfg.skipFilter ? 'yes' : 'no');
console.log(
  '  POSTS_SITE_FILTER_KEY   ',
  cfg.filterKey || '(empty — no domain filter param)',
);
console.log(
  '  STRAPI_API_TOKEN        ',
  process.env.STRAPI_API_TOKEN ? '(set)' : '(not set)',
);
console.log(
  '  SYNC_REQUIRE_SITE_FILTER',
  strictFilter ? 'yes (strict)' : 'no',
);

console.log('\nSample GET (page 1):\n  ' + buildSamplePostsUrl(cfg, 1) + '\n');

const issues = [];
if (!process.env.STRAPI_API_URL) {
  issues.push('STRAPI_API_URL is not set (defaulting to http://localhost:1337/api).');
}
if (!cfg.siteDomain && !cfg.skipFilter) {
  issues.push('SITE_DOMAIN is unset — sync runs without a site filter (see warning in fetch).');
}

if (strictFilter) {
  try {
    assertSiteFilterRequired(cfg);
    console.log('Site filter: OK (strict mode).\n');
  } catch (err) {
    issues.push(err.message);
  }
}

if (issues.length) {
  console.log('Notes:\n  - ' + issues.join('\n  - ') + '\n');
  if (strictFilter) {
    process.exit(1);
  }
}
