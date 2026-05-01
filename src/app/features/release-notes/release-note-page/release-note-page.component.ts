import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RELEASE_NOTES } from '../release-notes-content';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-release-note-page',
  templateUrl: './release-note-page.component.html',
  styleUrls: ['./release-note-page.component.css'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, RouterLink]
})
export class ReleaseNotePageComponent implements OnInit {
  slug = '';

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    const note = RELEASE_NOTES.find(n => n.slug === this.slug);
    if (!note) return;

    const url = `https://www.bandcentral.com/release-notes/${note.slug}`;

    this.seoService.setSeo({
      title: `${note.title} — Release Notes | Band Central`,
      description: note.metaDescription,
      url,
      ogType: 'article',
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: note.title,
      description: note.metaDescription,
      datePublished: note.date,
      url,
      author: { '@type': 'Organization', name: 'Band Central' },
      about: { '@type': 'SoftwareApplication', name: `Band Central for ${note.app}`, softwareVersion: note.version },
    });
  }
}
