import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), ...(site ? [sitemap()] : [])],
  vite: { plugins: [tailwindcss()] },
  build: { format: 'directory' }
});
