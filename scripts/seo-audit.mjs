import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(projectRoot, 'dist');
const productionOrigin = 'https://hisaablab.in';

if (process.argv.includes('--build')) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run the production SEO audit through `npm run test:seo`.');
  const build = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
    cwd: projectRoot,
    env: { ...process.env, PUBLIC_SITE_URL: productionOrigin, PUBLIC_ADS_ENABLED: 'false' },
    stdio: 'inherit'
  });
  if (build.error) throw build.error;
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const decode = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');
const attr = (html, pattern) => decode(html.match(pattern)?.[1]?.trim() ?? '');
const routeForFile = (file) => {
  const path = relative(distRoot, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
};
const fileForRoute = (route) => {
  const clean = route.split('#')[0].split('?')[0];
  if (clean === '/') return join(distRoot, 'index.html');
  if (clean.endsWith('/')) return join(distRoot, clean.slice(1), 'index.html');
  if (/\.[a-z0-9]+$/i.test(clean)) return join(distRoot, clean.slice(1));
  return join(distRoot, clean.slice(1), 'index.html');
};

assert(existsSync(distRoot), 'dist/ is missing; run a production build first.');
const htmlFiles = existsSync(distRoot) ? walk(distRoot).filter((file) => file.endsWith('.html')) : [];
const sitemapPath = join(distRoot, 'sitemap-0.xml');
const sitemapIndexPath = join(distRoot, 'sitemap-index.xml');
const robotsPath = join(distRoot, 'robots.txt');
assert(existsSync(sitemapPath), 'sitemap-0.xml is missing.');
assert(existsSync(sitemapIndexPath), 'sitemap-index.xml is missing.');
assert(existsSync(robotsPath), 'robots.txt is missing.');

const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert(sitemapUrls.length === new Set(sitemapUrls).size, 'Sitemap contains duplicate URLs.');
assert(sitemapUrls.every((url) => url.startsWith(`${productionOrigin}/`)), 'Sitemap contains a non-canonical origin.');
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8');
  assert(robots.includes(`Sitemap: ${productionOrigin}/sitemap-index.xml`), 'robots.txt does not advertise the canonical sitemap.');
}

const indexableTitles = new Map();
const indexableDescriptions = new Map();
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const label = route;
  const title = attr(html, /<title>([\s\S]*?)<\/title>/i);
  const description = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const robots = attr(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  const canonical = attr(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/gi) ?? []).length;
  const noindex = robots.includes('noindex');

  assert(title.length > 0, `${label}: missing title.`);
  assert(description.length > 0, `${label}: missing meta description.`);
  assert(robots.length > 0, `${label}: missing robots directive.`);
  assert(canonical.startsWith(`${productionOrigin}/`), `${label}: missing canonical production URL.`);
  assert(h1Count === 1, `${label}: expected exactly one h1, found ${h1Count}.`);
  assert(attr(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i) === title, `${label}: og:title does not match title.`);
  assert(attr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i).endsWith('/og-default.png'), `${label}: missing raster Open Graph image.`);
  assert(attr(html, /<meta\s+name="twitter:card"\s+content="([^"]*)"/i) === 'summary_large_image', `${label}: missing Twitter card.`);

  const schemaScripts = [...html.matchAll(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  assert(schemaScripts.length === 1, `${label}: expected one JSON-LD graph, found ${schemaScripts.length}.`);
  for (const script of schemaScripts) {
    try {
      const data = JSON.parse(script[1]);
      const types = (data['@graph'] ?? []).flatMap((item) => Array.isArray(item['@type']) ? item['@type'] : [item['@type']]);
      assert(types.includes('Organization') && types.includes('WebSite') && types.includes('WebPage'), `${label}: incomplete site entity graph.`);
    } catch (error) {
      failures.push(`${label}: invalid JSON-LD (${error.message}).`);
    }
  }

  if (noindex) {
    assert(!sitemapUrls.includes(canonical), `${label}: noindex URL must not appear in sitemap.`);
  } else {
    assert(title.length <= 65, `${label}: title is ${title.length} characters (target <= 65).`);
    assert(description.length >= 80 && description.length <= 165, `${label}: description is ${description.length} characters (target 80-165).`);
    assert(sitemapUrls.includes(canonical), `${label}: indexable canonical is missing from sitemap.`);
    if (indexableTitles.has(title)) failures.push(`${label}: duplicate title also used by ${indexableTitles.get(title)}.`);
    else indexableTitles.set(title, label);
    if (indexableDescriptions.has(description)) failures.push(`${label}: duplicate description also used by ${indexableDescriptions.get(description)}.`);
    else indexableDescriptions.set(description, label);
  }

  for (const match of html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)) {
    const href = decode(match[1]);
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = fileForRoute(href);
    assert(existsSync(target), `${label}: broken internal link ${href}.`);
  }
}

assert(existsSync(join(distRoot, 'og-default.png')), 'Raster social card is missing from dist.');

if (failures.length > 0) {
  console.error(`SEO audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SEO audit passed: ${htmlFiles.length} HTML pages, ${sitemapUrls.length} indexable sitemap URLs, unique titles/descriptions, valid canonicals and internal links.`);
