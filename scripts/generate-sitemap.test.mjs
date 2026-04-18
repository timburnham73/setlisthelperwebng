import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSitemap,
  parseBlogSlugs,
  getPriorityAndFreq,
  SITE_URL
} from './generate-sitemap.mjs';

test('Test 1: generator emits url entries for each provided route with correct loc, changefreq, priority', () => {
  const xml = generateSitemap({
    routes: ['/home', '/why', '/tools'],
    blogSlugs: []
  });

  // All three URLs present
  assert.match(xml, /<loc>https:\/\/www\.bandcentral\.com\/home<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.bandcentral\.com\/why<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.bandcentral\.com\/tools<\/loc>/);

  // Priority per table: /home -> 1.0, /why -> 0.9, /tools -> 0.8
  const homeBlock = xml.match(/<url>\s*<loc>[^<]*\/home<\/loc>[\s\S]*?<\/url>/)[0];
  assert.match(homeBlock, /<priority>1\.0<\/priority>/);
  assert.match(homeBlock, /<changefreq>monthly<\/changefreq>/);

  const whyBlock = xml.match(/<url>\s*<loc>[^<]*\/why<\/loc>[\s\S]*?<\/url>/)[0];
  assert.match(whyBlock, /<priority>0\.9<\/priority>/);
  assert.match(whyBlock, /<changefreq>monthly<\/changefreq>/);

  const toolsBlock = xml.match(/<url>\s*<loc>[^<]*\/tools<\/loc>[\s\S]*?<\/url>/)[0];
  assert.match(toolsBlock, /<priority>0\.8<\/priority>/);
  assert.match(toolsBlock, /<changefreq>monthly<\/changefreq>/);

  // Exactly 3 <url> blocks
  const urlCount = (xml.match(/<url>/g) || []).length;
  assert.equal(urlCount, 3, 'should have exactly 3 <url> blocks');
});

test('Test 2: /auth/login in routes.txt is excluded from generated sitemap', () => {
  const xml = generateSitemap({
    routes: ['/home', '/auth/login'],
    blogSlugs: []
  });
  assert.doesNotMatch(xml, /auth\/login/);
  assert.match(xml, /\/home</);
});

test('Test 3: /bands accidentally in routes.txt is excluded (defensive)', () => {
  const xml = generateSitemap({
    routes: ['/home', '/bands', '/bands/123', '/admin', '/users', '/about'],
    blogSlugs: []
  });
  assert.doesNotMatch(xml, /\/bands/);
  assert.doesNotMatch(xml, /\/admin/);
  assert.doesNotMatch(xml, /\/users/);
  assert.doesNotMatch(xml, /\/about/);
  assert.match(xml, /\/home</);
});

test('Test 4: blog post slugs are added as /blog/{slug} entries with changefreq=yearly, priority=0.6', () => {
  const xml = generateSitemap({
    routes: ['/blog'],
    blogSlugs: ['post-one', 'post-two']
  });
  assert.match(xml, /<loc>https:\/\/www\.bandcentral\.com\/blog\/post-one<\/loc>/);
  assert.match(xml, /<loc>https:\/\/www\.bandcentral\.com\/blog\/post-two<\/loc>/);

  const postOneBlock = xml.match(/<url>\s*<loc>[^<]*\/blog\/post-one<\/loc>[\s\S]*?<\/url>/)[0];
  assert.match(postOneBlock, /<priority>0\.6<\/priority>/);
  assert.match(postOneBlock, /<changefreq>yearly<\/changefreq>/);
});

test('Test 5: /blog landing appears exactly once (not duplicated)', () => {
  // Simulate the case where routes.txt includes /blog AND blogSlugs contribute /blog/ entries.
  // Also simulate a scenario where routes.txt happens to include /blog/some-post and
  // blogSlugs also lists "some-post" — the entry should appear once.
  const xml = generateSitemap({
    routes: ['/blog', '/blog/shared-post'],
    blogSlugs: ['shared-post', 'only-from-blog-content']
  });

  const blogLandingMatches = xml.match(/<loc>https:\/\/www\.bandcentral\.com\/blog<\/loc>/g) || [];
  assert.equal(blogLandingMatches.length, 1, '/blog landing should appear exactly once');

  const sharedPostMatches = xml.match(/<loc>https:\/\/www\.bandcentral\.com\/blog\/shared-post<\/loc>/g) || [];
  assert.equal(sharedPostMatches.length, 1, '/blog/shared-post should appear exactly once (deduped)');

  const onlyMatches = xml.match(/<loc>https:\/\/www\.bandcentral\.com\/blog\/only-from-blog-content<\/loc>/g) || [];
  assert.equal(onlyMatches.length, 1, 'blog-content-only slug should appear once');
});

test('Test 6: output is valid sitemap XML 0.9 format', () => {
  const xml = generateSitemap({
    routes: ['/home', '/why', '/contact'],
    blogSlugs: ['a-post']
  });
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<\/urlset>\s*$/);

  // Every <url> is well-formed (loc + changefreq + priority, each closed)
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  assert.ok(urlBlocks.length >= 4, 'should have at least 4 <url> blocks');
  for (const block of urlBlocks) {
    assert.match(block, /<loc>[^<]+<\/loc>/, `block missing loc: ${block}`);
    assert.match(block, /<changefreq>[^<]+<\/changefreq>/, `block missing changefreq: ${block}`);
    assert.match(block, /<priority>[^<]+<\/priority>/, `block missing priority: ${block}`);
  }
});

test('Test 7: running generator twice produces byte-identical output (deterministic)', () => {
  const args = {
    routes: ['/tools', '/home', '/why', '/blog', '/help', '/contact'],
    blogSlugs: ['b-post', 'a-post']
  };
  const first = generateSitemap(args);
  const second = generateSitemap(args);
  assert.equal(first, second, 'two runs should produce identical output');

  // Explicit: sorted order means /blog before /home before /tools etc.
  const locOrder = [...first.matchAll(/<loc>https:\/\/www\.bandcentral\.com([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sorted = [...locOrder].sort();
  assert.deepEqual(locOrder, sorted, 'loc entries should be in sorted order for determinism');
});

// Additional tests around the helper functions

test('getPriorityAndFreq returns expected values for priority table entries', () => {
  assert.deepEqual(getPriorityAndFreq('/home'), { priority: '1.0', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/'), { priority: '1.0', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/why'), { priority: '0.9', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/home/pricing'), { priority: '0.9', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/tools'), { priority: '0.8', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/help'), { priority: '0.8', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/tools/tap-tempo'), { priority: '0.7', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/help/ios'), { priority: '0.7', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/blog'), { priority: '0.7', changefreq: 'monthly' });
  assert.deepEqual(getPriorityAndFreq('/blog/some-post'), { priority: '0.6', changefreq: 'yearly' });
  assert.deepEqual(getPriorityAndFreq('/contact'), { priority: '0.5', changefreq: 'yearly' });
  assert.deepEqual(getPriorityAndFreq('/privacy-policy'), { priority: '0.3', changefreq: 'yearly' });
});

test('parseBlogSlugs extracts slugs from blog-content.ts source', () => {
  const fake = `
    export const BLOG_POSTS = [
      { slug: 'first-post', title: 'One' },
      { slug: 'second-post', title: 'Two' },
      {
        slug: 'third-post',
        title: 'Three'
      }
    ];
  `;
  const slugs = parseBlogSlugs(fake);
  assert.deepEqual(slugs, ['first-post', 'second-post', 'third-post']);
});

test('SITE_URL constant is the canonical bandcentral.com URL', () => {
  assert.equal(SITE_URL, 'https://www.bandcentral.com');
});
