import fs from 'fs';
import https from 'https';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
      })
      .on('error', reject);
  });
}

const local = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const live = await fetch('https://m99game.com/sitemap.xml');

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const localLocs = locs(local);
const liveLocs = locs(live.body);

const onlyLive = liveLocs.filter((u) => !localLocs.includes(u));
const onlyLocal = localLocs.filter((u) => !liveLocs.includes(u));

console.log('live status', live.status, 'content-type', live.headers['content-type']);
console.log('local locs', localLocs.length, 'live locs', liveLocs.length);
if (onlyLive.length) console.log('only on live:', onlyLive);
if (onlyLocal.length) console.log('only local:', onlyLocal);

const dup = liveLocs.filter((u, i) => liveLocs.indexOf(u) !== i);
if (dup.length) console.log('duplicate locs on live:', [...new Set(dup)]);
