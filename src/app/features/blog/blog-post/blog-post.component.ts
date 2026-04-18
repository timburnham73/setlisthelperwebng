import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BLOG_POSTS } from '../blog-content';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-blog-post',
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, RouterLink]
})
export class BlogPostComponent implements OnInit {
  slug = '';

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    const post = BLOG_POSTS.find(p => p.slug === this.slug);
    if (!post) return;

    const url = `https://www.bandcentral.com/blog/${post.slug}`;

    this.seoService.setSeo({
      title: `${post.title} | Band Central Blog`,
      description: post.metaDescription,
      url,
      ogType: 'article',
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.metaDescription,
      url,
      datePublished: post.date,
      author: { '@type': 'Organization', name: 'Band Central' },
      publisher: {
        '@type': 'Organization',
        name: 'Band Central',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.bandcentral.com/assets/favicon/android-icon-192x192.png',
        },
      },
    });
  }
}
