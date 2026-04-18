import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BLOG_POSTS } from '../blog-content';
import { BlogPost } from '../blog-post.model';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-blog-landing',
  templateUrl: './blog-landing.component.html',
  styleUrls: ['./blog-landing.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, RouterLink]
})
export class BlogLandingComponent implements OnInit {
  posts: BlogPost[] = BLOG_POSTS;

  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.setSeo({
      title: 'Band Central Blog - Tips for Musicians and Bands',
      description: 'Articles for working musicians and bands: song organization, setlist planning, cover band strategies, worship team tips.',
      url: 'https://www.bandcentral.com/blog',
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Band Central Blog',
      url: 'https://www.bandcentral.com/blog',
      blogPost: this.posts.map(p => ({
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.metaDescription,
        url: `https://www.bandcentral.com/blog/${p.slug}`,
        datePublished: p.date,
      })),
    });
  }
}
