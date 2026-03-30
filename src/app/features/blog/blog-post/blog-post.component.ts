import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BLOG_POSTS } from '../blog-content';

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
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    const post = BLOG_POSTS.find(p => p.slug === this.slug);
    if (post) {
      this.titleService.setTitle(post.title + ' - Band Central');
      this.meta.updateTag({ name: 'description', content: post.metaDescription });
    }
  }
}
