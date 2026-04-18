import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../home/header/header.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-help-migration',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatCardModule, MatIconModule, HeaderComponent],
  templateUrl: './help-migration.component.html',
  styleUrls: ['./help-migration.component.css']
})
export class HelpMigrationComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.setSeo({
      title: 'Setlist Helper Migration Guide - Band Central',
      description: 'Step-by-step guide to import your songs, setlists, and lyrics from Setlist Helper into Band Central. Free, automatic migration.',
      url: 'https://www.bandcentral.com/help/migration',
    });
    this.seoService.clearJsonLd();
  }

  scrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
