import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlogRoutingModule } from './blog-routing.module';
import { BlogLandingComponent } from './blog-landing/blog-landing.component';
import { BlogPostComponent } from './blog-post/blog-post.component';

@NgModule({
  imports: [
    CommonModule,
    BlogRoutingModule,
    BlogLandingComponent,
    BlogPostComponent
  ]
})
export class BlogModule { }
