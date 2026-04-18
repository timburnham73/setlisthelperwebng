import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

/**
 * Metadata passed to {@link SeoService.setSeo}. Supply the full, brand-suffixed
 * `title`, a `<=160` char `description`, and the absolute canonical `url`. The
 * service will emit a coherent set of `<title>`, `<meta name="description">`,
 * `<link rel="canonical">`, Open Graph, and Twitter Card tags from this one call.
 */
export interface SeoMetadata {
  /** Full <title> content including brand suffix. */
  title: string;
  /** Meta description; aim for <= 160 characters. */
  description: string;
  /** Absolute canonical URL for the page (used for og:url, twitter, canonical link). */
  url: string;
  /** Open Graph content type. Defaults to `'website'`. */
  ogType?: 'website' | 'article';
  /** Absolute URL to the og:image. Defaults to the site logo. */
  ogImage?: string;
}

const DEFAULT_OG_IMAGE = 'https://www.bandcentral.com/assets/favicon/android-icon-192x192.png';
const DEFAULT_JSONLD_ID = 'page-jsonld';

/**
 * Centralized SEO service: sets `<title>`, meta description, canonical link,
 * Open Graph, Twitter Card, and optional per-page JSON-LD structured data.
 *
 * Safe to call during Angular SSR / prerender — uses DOCUMENT injection rather
 * than the global `document` so tags land in the prerendered HTML output.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  /**
   * Set title + description + canonical link + Open Graph + Twitter Card meta
   * tags for the current route. Idempotent: repeat calls update existing tags
   * rather than duplicating them.
   */
  setSeo(metadata: SeoMetadata): void {
    const ogType = metadata.ogType ?? 'website';
    const ogImage = metadata.ogImage ?? DEFAULT_OG_IMAGE;

    // <title>
    this.titleService.setTitle(metadata.title);

    // Description
    this.meta.updateTag({ name: 'description', content: metadata.description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:url', content: metadata.url });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:image', content: ogImage });

    // Twitter Card (uses `name`, not `property`)
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: metadata.title });
    this.meta.updateTag({ name: 'twitter:description', content: metadata.description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // Canonical link — create if missing, otherwise update href
    this.setCanonical(metadata.url);
  }

  /**
   * Create or replace a `<script id="page-jsonld" type="application/ld+json">`
   * element in `<head>` with the provided schema object. Works during SSR.
   */
  setJsonLd(schema: object, id: string = DEFAULT_JSONLD_ID): void {
    const head = this.doc.head;
    if (!head) return;

    let script = this.doc.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = this.doc.createElement('script') as HTMLScriptElement;
      script.id = id;
      script.type = 'application/ld+json';
      head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
  }

  /**
   * Remove the page-level JSON-LD `<script>` if present. No-op if absent.
   * Use when navigating to a route that should not carry a prior page's schema.
   */
  clearJsonLd(id: string = DEFAULT_JSONLD_ID): void {
    const script = this.doc.getElementById(id);
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  /** Create or update the `<link rel="canonical">` href. */
  private setCanonical(url: string): void {
    const head = this.doc.head;
    if (!head) return;

    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
