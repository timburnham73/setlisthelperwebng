import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../home/header/header.component';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-tools-landing',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    HeaderComponent,
  ],
  templateUrl: './tools-landing.component.html',
  styleUrls: ['./tools-landing.component.css'],
})
export class ToolsLandingComponent implements OnInit {
  tools = [
    {
      name: 'BPM Tap Tempo',
      description: 'Tap your spacebar or screen to detect the tempo of any song in beats per minute. Great for figuring out the BPM of a song during rehearsal.',
      icon: 'touch_app',
      route: '/tools/tap-tempo',
    },
    {
      name: 'Chord Transpose',
      description: 'Paste chords or lyrics with chords and transpose up or down by semitones. Supports sharp and flat notation for any key change.',
      icon: 'swap_vert',
      route: '/tools/transpose',
    },
    {
      name: 'Online Metronome',
      description: 'A precise metronome with adjustable BPM, time signatures, tempo markings from Largo to Presto, and a visual beat indicator.',
      icon: 'timer',
      route: '/tools/metronome',
    },
  ];

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Free Musician Tools - Metronome, Transpose, Tap Tempo',
      description: 'Free online tools for musicians: metronome with visual beat indicator, chord transposition tool, and BPM tap-tempo counter. No signup required.',
      url: 'https://www.bandcentral.com/tools',
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Free Musician Tools',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Online Metronome', url: 'https://www.bandcentral.com/tools/metronome' },
        { '@type': 'ListItem', position: 2, name: 'Chord Transpose Tool', url: 'https://www.bandcentral.com/tools/transpose' },
        { '@type': 'ListItem', position: 3, name: 'BPM Tap Tempo', url: 'https://www.bandcentral.com/tools/tap-tempo' },
      ],
    });
  }
}
