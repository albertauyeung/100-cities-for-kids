#!/usr/bin/env node
/**
 * Prerender every route to a static HTML file with per-route SEO metadata.
 * Run after `vite build` (client) and `vite build --ssr` (server bundle).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(WEB_DIR, '../docs');
const SERVER_BUNDLE = path.join(WEB_DIR, 'dist-server/entry-server.js');
const CITIES_JSON = path.join(WEB_DIR, 'src/data/cities.json');

const SITE_BASENAME = '/100-cities-for-kids';
const SITE_ORIGIN = 'https://ayeung.dev';
const SITE_URL = SITE_ORIGIN + SITE_BASENAME;
const SITE_NAME = '100 Cities for Kids';
const SITE_TAGLINE = 'Explore the world with curious minds';
const SITE_DESCRIPTION =
  'Discover 100 amazing cities around the world. Kid-friendly stories about cultures, landmarks, famous people, and fun facts — perfect for curious young explorers.';

const continentLabels = {
  africa: 'Africa',
  asia: 'Asia',
  australia: 'Australia',
  europe: 'Europe',
  'north-america': 'North America',
  'south-america': 'South America',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeDescription(text, max = 160) {
  const t = stripMarkdown(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

function metaTags({ title, description, canonical, ogType = 'website', ogImage, jsonLd }) {
  const lines = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  ];
  if (ogImage) {
    lines.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
    lines.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);
  }
  if (jsonLd) {
    const safe = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
    lines.push(`<script type="application/ld+json">${safe}</script>`);
  }
  return lines.join('\n    ');
}

function fillTemplate(template, { title, headExtra, body }) {
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('<!--ssr-head-->', headExtra)
    .replace('<!--ssr-outlet-->', body);
}

async function main() {
  const cities = JSON.parse(fs.readFileSync(CITIES_JSON, 'utf-8'));
  const template = fs.readFileSync(path.join(DOCS_DIR, 'index.html'), 'utf-8');

  const serverModule = await import(pathToFileURL(SERVER_BUNDLE).href);
  const { render } = serverModule;

  const routes = [
    { url: '/', outFile: 'index.html' },
    ...cities.map((c) => ({
      url: `/city/${c.id}`,
      outFile: path.join('city', c.id, 'index.html'),
      city: c,
    })),
  ];

  for (const route of routes) {
    const body = render(route.url);
    let title;
    let description;
    let jsonLd;
    let ogType = 'website';

    if (route.city) {
      const c = route.city;
      const place = c.country ? `${c.name}, ${c.country}` : c.name;
      title = `${place} for Kids — ${SITE_NAME}`;
      const lead = stripMarkdown(c.content);
      description = makeDescription(
        `Discover ${place}: a kid-friendly tour of culture, landmarks, and fun facts. ${lead}`
      );
      ogType = 'article';
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: place,
        description,
        articleSection: continentLabels[c.continent] || c.continent,
        inLanguage: 'en',
        isFamilyFriendly: true,
        about: {
          '@type': 'Place',
          name: c.name,
          ...(c.country && {
            address: {
              '@type': 'PostalAddress',
              addressCountry: c.country,
            },
          }),
        },
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: SITE_URL + '/',
        },
        url: SITE_URL + route.url,
      };
    } else {
      title = `${SITE_NAME} — ${SITE_TAGLINE}`;
      description = SITE_DESCRIPTION;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL + '/',
        inLanguage: 'en',
        audience: {
          '@type': 'Audience',
          audienceType: 'Children',
        },
      };
    }

    const canonical = SITE_URL + (route.url === '/' ? '/' : route.url);
    const headExtra = metaTags({ title, description, canonical, ogType, jsonLd });
    const html = fillTemplate(template, { title, headExtra, body });

    const outPath = path.join(DOCS_DIR, route.outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`✓ ${route.url} → ${path.relative(DOCS_DIR, outPath)}`);
  }

  // 404.html — same content as home so GH Pages can serve the SPA for unknown paths.
  fs.copyFileSync(path.join(DOCS_DIR, 'index.html'), path.join(DOCS_DIR, '404.html'));
  console.log('✓ 404.html (copy of index.html)');

  // sitemap.xml
  const urls = routes.map((r) => SITE_URL + (r.url === '/' ? '/' : r.url));
  const today = new Date().toISOString().slice(0, 10);
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u, i) =>
          `  <url>\n    <loc>${escapeHtml(u)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${i === 0 ? '1.0' : '0.8'}</priority>\n  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(DOCS_DIR, 'sitemap.xml'), sitemap);
  console.log(`✓ sitemap.xml (${urls.length} urls)`);

  // robots.txt
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${joinUrl(SITE_URL, 'sitemap.xml')}\n`;
  fs.writeFileSync(path.join(DOCS_DIR, 'robots.txt'), robots);
  console.log('✓ robots.txt');

  // Clean up SSR build artifacts.
  fs.rmSync(path.join(WEB_DIR, 'dist-server'), { recursive: true, force: true });
  console.log('✓ cleaned dist-server');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
