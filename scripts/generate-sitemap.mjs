#!/usr/bin/env node
// scripts/generate-sitemap.mjs
//
// Generates src/sitemap.xml from a single source of truth:
//   - routes.txt at the repo root (canonical public routes)
//   - BLOG_POSTS in src/app/features/blog/blog-content.ts (blog slugs)
//
// Pure generateSitemap() function is exported for unit tests; CLI block at
// the bottom reads the real files and writes src/sitemap.xml when invoked
// directly (e.g. `node scripts/generate-sitemap.mjs` or via the
// `generate-sitemap` npm script).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const SITE_URL = 'https://www.bandcentral.com';

// Routes excluded from the sitemap even if present in routes.txt.
// /auth/login is prerendered only for SSR build plumbing and is not
// indexable content. The rest are defensive — if routes.txt ever
// accidentally picks up an auth-gated route we don't want to ship it.
const EXCLUDE_PATTERNS = [
  /^\/auth(\/|$)/,
  /^\/bands(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/users(\/|$)/,
  /^\/about(\/|$)/
];

/**
 * Return { priority, changefreq } for a given route path.
 * Implements the priority/changefreq table from the plan.
 */
export function getPriorityAndFreq(path) {
  // Most-specific patterns first — order matters.
  if (path === '/' || path === '/home') {
    return { priority: '1.0', changefreq: 'monthly' };
  }
  if (path === '/why') {
    return { priority: '0.9', changefreq: 'monthly' };
  }
  if (path === '/home/pricing') {
    return { priority: '0.9', changefreq: 'monthly' };
  }
  if (path === '/tools' || path === '/help') {
    return { priority: '0.8', changefreq: 'monthly' };
  }
  if (path === '/blog') {
    return { priority: '0.7', changefreq: 'monthly' };
  }
  if (path.startsWith('/blog/')) {
    return { priority: '0.6', changefreq: 'yearly' };
  }
  if (path.startsWith('/tools/') || path.startsWith('/help/')) {
    return { priority: '0.7', changefreq: 'monthly' };
  }
  if (path === '/contact') {
    return { priority: '0.5', changefreq: 'yearly' };
  }
  if (path === '/privacy-policy') {
    return { priority: '0.3', changefreq: 'yearly' };
  }
  // Sensible default for routes not explicitly listed. Keeps the generator
  // forgiving if someone adds a new top-level route to routes.txt without
  // updating this table — it still ships to the sitemap.
  return { priority: '0.5', changefreq: 'monthly' };
}

/**
 * Extract blog post slugs from the raw text of
 * src/app/features/blog/blog-content.ts using a global regex.
 * Deliberately structural: if the format changes the tests will fail
 * and this helper can be updated. Avoids pulling in ts-node.
 */
export function parseBlogSlugs(source) {
  const slugs = [];
  const re = /slug:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    slugs.push(match[1]);
  }
  return slugs;
}

/**
 * Escape XML-significant characters in a URL. Paths are ASCII slug-like in
 * this project so this is mostly defensive.
 */
function xmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Pure function: build the sitemap XML from a list of routes and blog slugs.
 *
 * @param {object} opts
 * @param {string[]} opts.routes - Paths from routes.txt (or fixture).
 * @param {string[]} opts.blogSlugs - Slugs from BLOG_POSTS (or fixture).
 * @param {string} [opts.siteUrl] - Override base URL.
 * @returns {string} XML sitemap document ending with a newline.
 */
export function generateSitemap({ routes, blogSlugs, siteUrl = SITE_URL }) {
  const excluded = (path) => EXCLUDE_PATTERNS.some((re) => re.test(path));

  // Merge and dedupe. Use a Set to collapse any overlap between routes.txt
  // and /blog/{slug} entries.
  const merged = new Set();
  for (const r of routes) {
    if (!r) continue;
    if (excluded(r)) continue;
    merged.add(r);
  }
  for (const slug of blogSlugs) {
    const path = `/blog/${slug}`;
    if (excluded(path)) continue;
    merged.add(path);
  }

  // Deterministic output — sort alphabetically.
  const sorted = [...merged].sort();

  const urlBlocks = sorted.map((path) => {
    const { priority, changefreq } = getPriorityAndFreq(path);
    const loc = xmlEscape(`${siteUrl}${path}`);
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlBlocks.join('\n')}
</urlset>
`;
}

// --- CLI entry ------------------------------------------------------------
// When executed directly, read real inputs and write src/sitemap.xml.
const isCli =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file://${resolve(process.argv[1] || '')}`;

if (isCli) {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(scriptDir, '..');

  const routesPath = resolve(repoRoot, 'routes.txt');
  const blogPath = resolve(repoRoot, 'src/app/features/blog/blog-content.ts');
  const outPath = resolve(repoRoot, 'src/sitemap.xml');

  const routes = readFileSync(routesPath, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const blogSource = readFileSync(blogPath, 'utf8');
  const blogSlugs = parseBlogSlugs(blogSource);

  const xml = generateSitemap({ routes, blogSlugs });
  writeFileSync(outPath, xml, 'utf8');

  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`Generated sitemap with ${urlCount} URLs -> ${outPath}`);
}
