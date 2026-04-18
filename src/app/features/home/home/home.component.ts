import { Component, AfterViewInit, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { IntroOneComponent } from '../intro-one/intro-one.component';
import { PricingsComponent } from '../pricings/pricings.component';
import { FooterComponent } from '../footer/footer.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    IntroOneComponent,
    PricingsComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnInit {
  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    // HomeComponent is the parent for /home AND /home/pricing. When a child
    // route like /home/pricing is active, skip setting home's SEO so the
    // child's setSeo() is not overwritten during prerender / client nav.
    const hasChildRoute = this.route.snapshot.children.length > 0;
    if (hasChildRoute) {
      return;
    }

    this.seoService.setSeo({
      title: "Band Central - Manage Your Band's Songs, Setlists & Lyrics",
      description: 'Band Central helps bands manage songs, setlists, lyrics, and ChordPro charts across iOS, Android, and web. Collaborate with your band in real time.',
      url: 'https://www.bandcentral.com/home',
    });
    // No page-specific JSON-LD: the global Organization + SoftwareApplication
    // schemas in src/index.html are the canonical home-page structured data.
    this.seoService.clearJsonLd();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    });
  }
}
