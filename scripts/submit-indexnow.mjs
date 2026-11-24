import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXNOW_KEY, INDEXNOW_KEY_FILE, INDEXNOW_ORIGIN } from './indexnow-config.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(projectRoot, 'dist', 'sitemap-0.xml');

if (!existsSync(sitemapPath)) {
  throw new Error('dist/sitemap-0.xml is missing. Run `npm run test:seo` before submitting URLs.');
}

const sitemap = readFileSync(sitemapPath, 'utf8');
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => match[1])
  .filter((url) => url.startsWith(`${INDEXNOW_ORIGIN}/`));

if (urlList.length === 0) {
  throw new Error('The production sitemap contains no canonical HisaabLab URLs.');
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(INDEXNOW_ORIGIN).host,
    key: INDEXNOW_KEY,
    keyLocation: `${INDEXNOW_ORIGIN}/${INDEXNOW_KEY_FILE}`,
    urlList
  })
});

if (!response.ok) {
  const detail = (await response.text()).trim();
  throw new Error(`IndexNow submission failed with HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
}

console.log(`IndexNow accepted ${urlList.length} canonical URLs (HTTP ${response.status}).`);
