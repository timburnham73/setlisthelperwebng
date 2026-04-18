import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HelpSectionComponent } from '../help-section/help-section.component';
import { HELP_CONTENT, HelpPageContent } from '../help-content';
import { HeaderComponent } from '../../home/header/header.component';
import { SeoService } from '../../../core/services/seo.service';

interface PlatformSeo {
  title: string;
  description: string;
  url: string;
}

const PLATFORM_SEO: Record<string, PlatformSeo> = {
  ios: {
    title: 'Band Central for iOS - Help & Tutorials',
    description: 'Help documentation for the Band Central iOS app: getting started, managing songs, building setlists, and using ChordPro.',
    url: 'https://www.bandcentral.com/help/ios',
  },
  android: {
    title: 'Band Central for Android - Help & Tutorials',
    description: 'Help documentation for the Band Central Android app: getting started, managing songs, building setlists, and using ChordPro.',
    url: 'https://www.bandcentral.com/help/android',
  },
  web: {
    title: 'Band Central Web - Help & Tutorials',
    description: 'Help documentation for Band Central on the web: getting started, managing songs, building setlists, and using ChordPro.',
    url: 'https://www.bandcentral.com/help/web',
  },
};

const FALLBACK_SEO: PlatformSeo = {
  title: 'Band Central Help & Support',
  description: 'Get help using Band Central on iOS, Android, and web. Migration guide from Setlist Helper, tutorials, and troubleshooting.',
  url: 'https://www.bandcentral.com/help',
};

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [MatToolbarModule, RouterLink, HelpSectionComponent, HeaderComponent],
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.css']
})
export class HelpPageComponent implements OnInit {
  content!: HelpPageContent;
  platform = '';

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.platform = this.route.snapshot.paramMap.get('platform') || 'ios';
    this.content = HELP_CONTENT[this.platform];

    if (!this.content) {
      this.content = HELP_CONTENT['ios'];
      this.platform = 'ios';
    }

    const seo = PLATFORM_SEO[this.platform] ?? FALLBACK_SEO;
    this.seoService.setSeo(seo);
    this.seoService.clearJsonLd();
  }
}
