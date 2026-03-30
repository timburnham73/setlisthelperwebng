import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BLOG_POSTS } from '../blog-content';
import { BlogPost } from '../blog-post.model';

@Component({
  selector: 'app-blog-landing',
  templateUrl: './blog-landing.component.html',
  styleUrls: ['./blog-landing.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, RouterLink]
})
export class BlogLandingComponent implements OnInit {
  posts: BlogPost[] = BLOG_POSTS;

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Blog - Band Central');
    this.meta.updateTag({ name: 'description', content: 'Tips, guides, and best practices for bands, worship teams, and gigging musicians. Song management, setlist building, and band organization.' });
  }
}
