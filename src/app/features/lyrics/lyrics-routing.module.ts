import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LyricsComponent } from './lyrics-view/lyrics.component';
import { LyricsEditComponent } from './lyrics-edit/lyrics-edit.component';
import { LayoutNoSidebarChildViewComponent } from 'src/app/shared/layout-no-sidebar-child-view/layout-no-sidebar-child-view.component';


const routes: Routes = [
  {
    path: '',
    component: LayoutNoSidebarChildViewComponent,
    children: [
      { path: '', component: LyricsComponent },
    ]
  },
  {
    path: ':lyricid',
    component: LayoutNoSidebarChildViewComponent,
    children: [
      { path: '', component: LyricsComponent },
      { path: 'edit', component: LyricsEditComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LyricsRoutingModule { }
