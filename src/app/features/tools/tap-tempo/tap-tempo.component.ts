import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../../home/header/header.component';

@Component({
  selector: 'app-tap-tempo',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent,
  ],
  templateUrl: './tap-tempo.component.html',
  styleUrls: ['./tap-tempo.component.css'],
})
export class TapTempoComponent implements OnInit {
  bpm = 0;
  tapCount = 0;
  private taps: number[] = [];
  private maxTaps = 12;
  private resetTimeout = 3000;

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'BPM Tap Tempo - Free Online Tool | Band Central',
      description: 'Tap your spacebar or screen to detect the tempo of any song in beats per minute. Free online BPM counter tool.',
      url: 'https://www.bandcentral.com/tools/tap-tempo',
    });
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'BPM Tap Tempo',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: 'https://www.bandcentral.com/tools/tap-tempo',
      description: 'Tap your spacebar or screen to detect the tempo of any song in beats per minute.',
    });
  }

  @HostListener('document:keydown.space', ['$event'])
  onSpacebar(event: KeyboardEvent): void {
    event.preventDefault();
    this.tap();
  }

  tap(): void {
    const now = performance.now();

    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > this.resetTimeout) {
      this.taps = [];
    }

    this.taps.push(now);
    if (this.taps.length > this.maxTaps) {
      this.taps.shift();
    }

    this.tapCount = this.taps.length;

    if (this.taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.taps.length; i++) {
        intervals.push(this.taps[i] - this.taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      this.bpm = Math.round(60000 / avgInterval);
    }
  }

  reset(): void {
    this.taps = [];
    this.bpm = 0;
    this.tapCount = 0;
  }

  getTempoMarking(): string {
    if (this.bpm === 0) return '';
    if (this.bpm < 60) return 'Largo';
    if (this.bpm < 66) return 'Larghetto';
    if (this.bpm < 76) return 'Adagio';
    if (this.bpm < 108) return 'Andante';
    if (this.bpm < 120) return 'Moderato';
    if (this.bpm < 156) return 'Allegro';
    if (this.bpm < 176) return 'Vivace';
    if (this.bpm < 200) return 'Presto';
    return 'Prestissimo';
  }
}
