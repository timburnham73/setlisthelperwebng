import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-help-migration',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatCardModule, MatIconModule],
  templateUrl: './help-migration.component.html',
  styleUrls: ['./help-migration.component.css']
})
export class HelpMigrationComponent implements OnInit {
  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Band Central - Migrate from Setlist Helper');
    this.meta.updateTag({ name: 'description', content: 'Step-by-step guide to migrate your songs, setlists, and data from Setlist Helper to Band Central. Import your existing data easily.' });
  }

  scrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
