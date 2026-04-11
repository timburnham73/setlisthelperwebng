import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderComponent } from '../../home/header/header.component';

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

  constructor(private titleService: Title, private meta: Meta) {}

  ngOnInit(): void {
    this.titleService.setTitle('Free Musician Tools - Band Central');
    this.meta.updateTag({ name: 'description', content: 'Free online tools for musicians: BPM tap tempo, chord transpose, and metronome. No signup required. Part of Band Central.' });
    this.meta.updateTag({ property: 'og:title', content: 'Free Musician Tools - Band Central' });
    this.meta.updateTag({ property: 'og:description', content: 'Free online tools for musicians: BPM tap tempo, chord transpose, and metronome.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.bandcentral.com/tools' });
  }
}
