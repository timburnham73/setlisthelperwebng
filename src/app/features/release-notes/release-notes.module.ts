import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReleaseNotesRoutingModule } from './release-notes-routing.module';
import { ReleaseNotesLandingComponent } from './release-notes-landing/release-notes-landing.component';
import { ReleaseNotePageComponent } from './release-note-page/release-note-page.component';

@NgModule({
  imports: [
    CommonModule,
    ReleaseNotesRoutingModule,
    ReleaseNotesLandingComponent,
    ReleaseNotePageComponent
  ]
})
export class ReleaseNotesModule { }
