import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { HeaderComponent } from '../header/header.component';
import { IntroOneComponent } from '../intro-one/intro-one.component';
import { PricingsComponent } from '../pricings/pricings.component';
import { FooterComponent } from '../footer/footer.component';

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
  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Band Central - Manage Your Band\'s Songs, Setlists & Lyrics');
    this.meta.updateTag({ name: 'description', content: 'Band Central helps bands manage songs, setlists, lyrics, and ChordPro charts across iOS, Android, and web. Collaborate with your band in real time.' });
    this.meta.updateTag({ property: 'og:title', content: 'Band Central - Manage Your Band\'s Songs, Setlists & Lyrics' });
    this.meta.updateTag({ property: 'og:description', content: 'Band Central helps bands manage songs, setlists, lyrics, and ChordPro charts across iOS, Android, and web. Collaborate with your band in real time.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.bandcentral.com' });
  }

  ngAfterViewInit() {
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
