import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BlogLandingComponent } from './blog-landing/blog-landing.component';
import { BlogPostComponent } from './blog-post/blog-post.component';

const routes: Routes = [
  {
    path: '',
    component: BlogLandingComponent,
  },
  {
    path: ':slug',
    component: BlogPostComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogRoutingModule { }
