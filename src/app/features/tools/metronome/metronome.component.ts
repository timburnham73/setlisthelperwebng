import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HeaderComponent } from '../../home/header/header.component';
import { MetronomeAudioService } from './metronome-audio.service';
import { Subscription } from 'rxjs';

interface TimeSignature {
  label: string;
  beats: number;
}

@Component({
  selector: 'app-metronome',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    HeaderComponent,
  ],
  providers: [MetronomeAudioService],
  templateUrl: './metronome.component.html',
  styleUrls: ['./metronome.component.css'],
})
export class MetronomeComponent implements OnInit, OnDestroy {
  bpm = 120;
  isPlaying = false;
  currentBeat = -1;
  selectedTimeSignature: TimeSignature;

  timeSignatures: TimeSignature[] = [
    { label: '2/4', beats: 2 },
    { label: '3/4', beats: 3 },
    { label: '4/4', beats: 4 },
    { label: '5/4', beats: 5 },
    { label: '6/8', beats: 6 },
    { label: '7/8', beats: 7 },
  ];

  // Tap tempo state
  private taps: number[] = [];
  private beatSub: Subscription | null = null;

  constructor(
    private titleService: Title,
    private meta: Meta,
    private audioService: MetronomeAudioService,
  ) {
    this.selectedTimeSignature = this.timeSignatures[2]; // 4/4
  }

  ngOnInit(): void {
    this.titleService.setTitle('Online Metronome - Free Tool | Band Central');
    this.meta.updateTag({ name: 'description', content: 'Free online metronome with adjustable BPM, time signatures, tempo markings from Largo to Presto, and visual beat indicator. Uses Web Audio for precise timing.' });
    this.meta.updateTag({ property: 'og:title', content: 'Online Metronome - Free Tool | Band Central' });
    this.meta.updateTag({ property: 'og:description', content: 'Free online metronome with adjustable BPM, time signatures, and visual beat indicator.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://www.bandcentral.com/tools/metronome' });

    this.beatSub = this.audioService.beat$.subscribe(beat => {
      this.currentBeat = beat;
    });
  }

  ngOnDestroy(): void {
    this.audioService.stop();
    this.beatSub?.unsubscribe();
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.audioService.stop();
      this.isPlaying = false;
      this.currentBeat = -1;
    } else {
      this.audioService.start(this.bpm, this.selectedTimeSignature.beats);
      this.isPlaying = true;
    }
  }

  onBpmSliderChange(value: number): void {
    this.bpm = value;
    this.audioService.setBpm(this.bpm);
  }

  onBpmInputChange(): void {
    if (this.bpm < 20) this.bpm = 20;
    if (this.bpm > 300) this.bpm = 300;
    this.audioService.setBpm(this.bpm);
  }

  onTimeSignatureChange(): void {
    this.audioService.setBeatsPerMeasure(this.selectedTimeSignature.beats);
    if (this.isPlaying) {
      this.audioService.stop();
      this.audioService.start(this.bpm, this.selectedTimeSignature.beats);
    }
  }

  adjustBpm(delta: number): void {
    this.bpm = Math.max(20, Math.min(300, this.bpm + delta));
    this.audioService.setBpm(this.bpm);
  }

  tapTempo(): void {
    const now = performance.now();
    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > 3000) {
      this.taps = [];
    }
    this.taps.push(now);
    if (this.taps.length > 8) this.taps.shift();

    if (this.taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < this.taps.length; i++) {
        intervals.push(this.taps[i] - this.taps[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      this.bpm = Math.round(60000 / avg);
      this.audioService.setBpm(this.bpm);
    }
  }

  getTempoMarking(): string {
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

  getBeatsArray(): number[] {
    return Array.from({ length: this.selectedTimeSignature.beats }, (_, i) => i);
  }
}
