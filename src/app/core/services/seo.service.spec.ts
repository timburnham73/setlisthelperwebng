import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

import { SeoService, SeoMetadata } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let doc: Document;

  const baseMeta: SeoMetadata = {
    title: 'Test Page - Band Central',
    description: 'A test page description that is under one-sixty characters long.',
    url: 'https://www.bandcentral.com/test',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Title, Meta],
    });
    service = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);

    // Clean up any leftover SEO elements from prior tests
    doc.head
      .querySelectorAll('link[rel="canonical"], script#page-jsonld')
      .forEach(el => el.remove());
    doc.querySelectorAll(
      'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]'
    ).forEach(el => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test 1 — setSeo sets title + description + og + twitter tags
  it('setSeo sets title, description, Open Graph tags, and Twitter Card tags', () => {
    service.setSeo(baseMeta);

    expect(doc.title).toBe(baseMeta.title);

    const descTag = doc.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descTag?.content).toBe(baseMeta.description);

    const ogTitle = doc.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    expect(ogTitle?.content).toBe(baseMeta.title);

    const ogDesc = doc.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    expect(ogDesc?.content).toBe(baseMeta.description);

    const ogUrl = doc.querySelector('meta[property="og:url"]') as HTMLMetaElement;
    expect(ogUrl?.content).toBe(baseMeta.url);

    const ogType = doc.querySelector('meta[property="og:type"]') as HTMLMetaElement;
    expect(ogType?.content).toBe('website');

    const ogImage = doc.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    expect(ogImage?.content).toContain('bandcentral.com');

    const twCard = doc.querySelector('meta[name="twitter:card"]') as HTMLMetaElement;
    expect(twCard?.content).toBe('summary_large_image');

    const twTitle = doc.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
    expect(twTitle?.content).toBe(baseMeta.title);

    const twDesc = doc.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
    expect(twDesc?.content).toBe(baseMeta.description);

    const twImage = doc.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
    expect(twImage?.content).toContain('bandcentral.com');
  });

  // Test 2 — canonical is created if missing
  it('setSeo creates a <link rel="canonical"> when none exists', () => {
    expect(doc.querySelector('link[rel="canonical"]')).toBeNull();

    service.setSeo(baseMeta);

    const canonical = doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical).toBeTruthy();
    expect(canonical.href).toBe(baseMeta.url);
  });

  // Test 3 — canonical is updated, not duplicated
  it('setSeo called twice updates the canonical link without duplicating it', () => {
    service.setSeo(baseMeta);
    service.setSeo({ ...baseMeta, url: 'https://www.bandcentral.com/another' });

    const canonicals = doc.querySelectorAll('link[rel="canonical"]');
    expect(canonicals.length).toBe(1);
    expect((canonicals[0] as HTMLLinkElement).href).toBe('https://www.bandcentral.com/another');
  });

  // Test 4 — setJsonLd creates the script with id=page-jsonld
  it('setJsonLd creates <script id="page-jsonld" type="application/ld+json"> with stringified schema', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: 'Hello' };
    service.setJsonLd(schema);

    const script = doc.getElementById('page-jsonld') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.type).toBe('application/ld+json');
    expect(JSON.parse(script.textContent || '{}')).toEqual(schema);
  });

  // Test 5 — setJsonLd replaces existing
  it('setJsonLd called twice replaces the existing script rather than duplicating', () => {
    service.setJsonLd({ '@type': 'Article', headline: 'First' });
    service.setJsonLd({ '@type': 'Article', headline: 'Second' });

    const scripts = doc.querySelectorAll('script#page-jsonld');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent || '{}').headline).toBe('Second');
  });

  // Test 6 — clearJsonLd removes the script, no-op if absent
  it('clearJsonLd removes the #page-jsonld script if present and no-ops otherwise', () => {
    // No-op when absent
    expect(() => service.clearJsonLd()).not.toThrow();
    expect(doc.getElementById('page-jsonld')).toBeNull();

    // Removes when present
    service.setJsonLd({ '@type': 'Article' });
    expect(doc.getElementById('page-jsonld')).not.toBeNull();
    service.clearJsonLd();
    expect(doc.getElementById('page-jsonld')).toBeNull();
  });

  // Test 7 — SSR safety: service instantiated with PLATFORM_ID = 'server' still works
  it('works when instantiated with server PLATFORM_ID (prerender-safe)', () => {
    const titleService = TestBed.inject(Title);
    const metaService = TestBed.inject(Meta);

    // Instantiate the service directly with PLATFORM_ID='server' — mirrors the
    // SSR path where Angular provides a server-side DOCUMENT. Angular's Meta
    // and Title services already handle that case; we just need to verify our
    // DOM writes (canonical, JSON-LD) work via the injected DOCUMENT.
    const serverService = new SeoService(titleService, metaService, doc, 'server' as unknown as object);
    serverService.setSeo(baseMeta);
    serverService.setJsonLd({ '@type': 'Article', headline: 'Server' });

    expect(doc.title).toBe(baseMeta.title);
    expect(doc.querySelector('link[rel="canonical"]')).not.toBeNull();
    const script = doc.getElementById('page-jsonld');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.textContent || '{}').headline).toBe('Server');
  });
});
