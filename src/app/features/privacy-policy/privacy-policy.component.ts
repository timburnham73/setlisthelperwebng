import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.css'],
    standalone: true,
    imports: [MatCardModule, MatToolbarModule, RouterLink]
})
export class PrivacyPolicyComponent implements OnInit {
  lastUpdated = 'February 16, 2026';

  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.setSeo({
      title: 'Band Central Privacy Policy',
      description: 'Band Central privacy policy: what data we collect, how we use it, and your rights. GDPR compliant. Last updated April 2026.',
      url: 'https://www.bandcentral.com/privacy-policy',
    });
    this.seoService.clearJsonLd();
  }
}
