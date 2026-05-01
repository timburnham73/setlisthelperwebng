import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RELEASE_NOTES } from '../release-notes-content';
import { ReleaseNote } from '../release-note.model';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-release-notes-landing',
  templateUrl: './release-notes-landing.component.html',
  styleUrls: ['./release-notes-landing.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, RouterLink]
})
export class ReleaseNotesLandingComponent implements OnInit {
  notes: ReleaseNote[] = RELEASE_NOTES;

  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.setSeo({
      title: 'Band Central Release Notes',
      description: 'Release notes for Band Central across iOS, Android, and the web — what was added, improved, and fixed in each version.',
      url: 'https://www.bandcentral.com/release-notes',
    });
  }
}
