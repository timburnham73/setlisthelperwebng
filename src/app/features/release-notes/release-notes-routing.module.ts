import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReleaseNotesLandingComponent } from './release-notes-landing/release-notes-landing.component';
import { ReleaseNotePageComponent } from './release-note-page/release-note-page.component';

const routes: Routes = [
  {
    path: '',
    component: ReleaseNotesLandingComponent,
  },
  {
    path: ':slug',
    component: ReleaseNotePageComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReleaseNotesRoutingModule { }
