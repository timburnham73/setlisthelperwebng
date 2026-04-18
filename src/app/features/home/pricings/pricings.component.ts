import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-pricings',
  standalone: true,
  imports: [
    MatButton,
    FlexLayoutModule
  ],
  templateUrl: './pricings.component.html',
  styleUrls: ['./pricings.component.scss']
})
export class PricingsComponent implements OnInit {

  constructor(
    private router: Router,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    // Pricings is both a standalone route (/home/pricing) and an embedded
    // child of the home page template. Only the standalone route should set
    // title + JSON-LD — otherwise the embedded instance would overwrite the
    // home page's SEO metadata. Use Router.url instead of ActivatedRoute
    // because the embedded instance inherits the parent's ActivatedRoute.
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    if (currentUrl !== '/home/pricing') {
      return;
    }

    this.seoService.setSeo({
      title: 'Band Central Pricing - Plans for Solo Musicians and Full Bands',
      description: 'Compare Band Central pricing plans. Free tier with 25 songs, paid tiers for solo musicians up to full bands with unlimited songs and setlists.',
      url: 'https://www.bandcentral.com/home/pricing',
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': 'https://www.bandcentral.com/home/pricing#product',
      name: 'Band Central',
      operatingSystem: 'iOS, Android, Web',
      applicationCategory: 'MusicApplication',
      description: 'Manage your band\'s songs, setlists, lyrics, and ChordPro charts. Compare subscription plans for solo musicians through large bands.',
      url: 'https://www.bandcentral.com/home/pricing',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free', description: '25 songs, 5 setlists, 1 band' },
        { '@type': 'Offer', price: '14.99', priceCurrency: 'USD', priceValidUntil: '2027-12-31', name: 'Solo/Duo', description: 'Unlimited songs and setlists, up to 2 members and 2 bands' },
        { '@type': 'Offer', price: '29.99', priceCurrency: 'USD', priceValidUntil: '2027-12-31', name: 'Small Band', description: 'Unlimited songs and setlists, up to 5 members and 5 bands' },
        { '@type': 'Offer', price: '59.99', priceCurrency: 'USD', priceValidUntil: '2027-12-31', name: 'Medium Band', description: 'Unlimited songs and setlists, up to 20 members and 10 bands' },
        { '@type': 'Offer', price: '79.99', priceCurrency: 'USD', priceValidUntil: '2027-12-31', name: 'Large Band', description: 'Unlimited songs and setlists, up to 100 members, unlimited bands' },
        { '@type': 'Offer', price: '99.99', priceCurrency: 'USD', priceValidUntil: '2027-12-31', name: 'Extra Large', description: 'Unlimited songs and setlists, up to 500 members, unlimited bands' },
      ],
    });
  }
}
