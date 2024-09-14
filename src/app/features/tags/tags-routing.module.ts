import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from 'src/app/shared/layout/layout.component';

import { AngularFireAuthGuard, redirectUnauthorizedTo } from '@angular/fire/compat/auth-guard';

import { TagListComponent } from './tag-list/tag-list.component';
import { TagSongsComponent } from './tag-songs/tag-songs.component';
import { LayoutNoSidebarChildViewComponent } from 'src/app/shared/layout-no-sidebar-child-view/layout-no-sidebar-child-view.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: TagListComponent, canActivate: [AngularFireAuthGuard], },
    ]
  },
  {
    path: ':tagid',
    component: LayoutNoSidebarChildViewComponent,
    children: [
      { path: '', component: TagSongsComponent, canActivate: [AngularFireAuthGuard], },
    ]
  },
  {
    path: ":songid/lyrics",
    loadChildren: () =>
      import("../lyrics/lyrics.module").then((m) => m.LyricsModule),
    canActivate: [AngularFireAuthGuard],
    data: { authGuardPipe: redirectUnauthorizedTo },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TagRoutingModule { }
