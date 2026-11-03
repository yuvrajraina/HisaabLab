import type { APIRoute } from 'astro';
export const GET: APIRoute = () => {
  const site = import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  const body = site ? `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap-index.xml\n` : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
