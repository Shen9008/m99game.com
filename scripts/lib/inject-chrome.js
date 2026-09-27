'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PARTIALS = path.join(ROOT, 'partials');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.cursor',
  'dist',
  'partials',
]);

const CLEAN_URL_REPLACEMENTS = [
  ['https://m99game.com/index.html', 'https://m99game.com/'],
  ['https://m99game.com/contact.html', 'https://m99game.com/contact'],
  ['https://m99game.com/m99-live-casino.html', 'https://m99game.com/m99-live-casino'],
  ['https://m99game.com/m99-player-guide.html', 'https://m99game.com/m99-player-guide'],
  ['https://m99game.com/responsible-gaming.html', 'https://m99game.com/responsible-gaming'],
  ['https://m99game.com/m99-bonuses.html', 'https://m99game.com/m99-bonuses'],
  ['https://m99game.com/m99-slots.html', 'https://m99game.com/m99-slots'],
  ['href="/index.html', 'href="/'],
  ['href="index.html#', 'href="/#'],
  ['href="index.html"', 'href="/"'],
  ['href="/contact.html', 'href="/contact'],
  ['href="contact.html', 'href="/contact'],
  ['href="/m99-live-casino.html', 'href="/m99-live-casino'],
  ['href="m99-live-casino.html', 'href="/m99-live-casino'],
  ['href="/m99-player-guide.html', 'href="/m99-player-guide'],
  ['href="m99-player-guide.html', 'href="/m99-player-guide'],
  ['href="/responsible-gaming.html', 'href="/responsible-gaming'],
  ['href="responsible-gaming.html', 'href="/responsible-gaming'],
  ['href="/m99-bonuses.html', 'href="/m99-bonuses'],
  ['href="m99-bonuses.html', 'href="/m99-bonuses'],
  ['href="/m99-slots.html', 'href="/m99-slots'],
  ['href="m99-slots.html', 'href="/m99-slots'],
];

const EMAIL_PLAIN = '<span class="contact-email">gambleadvisory@protonmail.com</span>';
const EMAIL_MAILTO = /<a href="mailto:gambleadvisory@protonmail.com">gambleadvisory@protonmail.com<\/a>/g;
const EMAIL_OFF_BLOCK =
  /<!--email_off--><a href="mailto:gambleadvisory@protonmail.com">gambleadvisory@protonmail.com<\/a><!--email_on-->/g;

function stripMailtoLinks(html) {
  return html.replace(EMAIL_OFF_BLOCK, EMAIL_PLAIN).replace(EMAIL_MAILTO, EMAIL_PLAIN);
}

function readPartial(name) {
  return fs.readFileSync(path.join(PARTIALS, name), 'utf8').trim();
}

function wrap(id, inner) {
  return `<!--ssr:${id}-->\n${inner}\n<!--/ssr:${id}-->`;
}

function replaceSlot(html, id, inner) {
  const wrapped = wrap(id, inner);
  const marked = new RegExp(`<!--ssr:${id}-->[\\s\\S]*?<!--/ssr:${id}-->`, 'i');
  if (marked.test(html)) return html.replace(marked, wrapped);
  const empty = new RegExp(`<div id="${id}"></div>`, 'i');
  if (empty.test(html)) return html.replace(empty, wrapped);
  return html;
}

function rewriteCleanUrls(html) {
  let out = html;
  for (const [from, to] of CLEAN_URL_REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return stripMailtoLinks(out);
}

function walkHtmlFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkHtmlFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

function injectChrome(opts = {}) {
  const header = readPartial('header.html');
  const footer = readPartial('footer.html');
  const cta = readPartial('cta-banner.html');

  const files = opts.files || walkHtmlFiles(ROOT);
  let changed = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (rel.startsWith('partials/')) continue;
    if (rel === 'contact.html') continue;

    let html = fs.readFileSync(file, 'utf8');
    const original = html;

    html = replaceSlot(html, 'partial-header', header);
    html = replaceSlot(html, 'partial-footer', footer);
    html = replaceSlot(html, 'partial-cta', cta);
    html = rewriteCleanUrls(html);

    if (html !== original) {
      fs.writeFileSync(file, html, 'utf8');
      changed += 1;
    }
  }

  return { files: files.length, changed };
}

if (require.main === module) {
  const result = injectChrome();
  console.log(`inject-chrome: updated ${result.changed} of ${result.files} HTML files`);
}

module.exports = { injectChrome, rewriteCleanUrls };
