import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../home/header/header.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-help-landing',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatCardModule, MatIconModule, HeaderComponent],
  templateUrl: './help-landing.component.html',
  styleUrls: ['./help-landing.component.css']
})
export class HelpLandingComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.setSeo({
      title: 'Band Central Help & Support',
      description: 'Get help using Band Central on iOS, Android, and web. Migration guide from Setlist Helper, tutorials, and troubleshooting.',
      url: 'https://www.bandcentral.com/help',
    });
    this.seoService.clearJsonLd();
  }
}
