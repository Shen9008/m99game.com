import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HOST = 'm99game.com';
const KEY = '8481468662acda5562d09a4185a3add3';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const INDEXNOW = 'https://api.indexnow.org/indexnow';

function urlsFromSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

const sitemapPath = path.join(ROOT, 'sitemap.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');
const urlList = urlsFromSitemap(xml);

const batchSize = 100;
for (let i = 0; i < urlList.length; i += batchSize) {
  const batch = urlList.slice(i, i + batchSize);
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: batch,
  };
  const res = await fetch(INDEXNOW, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow batch ${i / batchSize + 1}: HTTP ${res.status} (${batch.length} URLs)`);
}
