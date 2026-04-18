import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { HeaderComponent } from '../../home/header/header.component';

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

const CHORD_REGEX = /\b([A-G])([#b]?)(m(?:aj|in)?|dim|aug|sus[24]?|add|M|6|7|9|11|13|dom|°|ø|Δ|\+|-|\d)*(?:\/([A-G])([#b]?))?/g;

@Component({
  selector: 'app-transpose',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    HeaderComponent,
  ],
  templateUrl: './transpose.component.html',
  styleUrls: ['./transpose.component.css'],
})
export class TransposeComponent implements OnInit {
  inputText = '';
  transposedText = '';
  semitones = 0;
  useFlats = false;

  sampleText = `C        Am       F        G
Amazing grace, how sweet the sound
Dm       G7       C
That saved a wretch like me`;

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'Chord Transpose Tool - Free Online | Band Central',
      description: 'Free online chord transposition tool. Paste ChordPro or chord-over-lyrics and shift to any key instantly. No signup required.',
      url: 'https://www.bandcentral.com/tools/transpose',
    });
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Chord Transpose Tool',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: 'https://www.bandcentral.com/tools/transpose',
      description: 'Free online chord transposition tool. Paste ChordPro or chord-over-lyrics and shift to any key instantly.',
    });
  }

  transposeUp(): void {
    this.semitones++;
    this.transpose();
  }

  transposeDown(): void {
    this.semitones--;
    this.transpose();
  }

  resetTranspose(): void {
    this.semitones = 0;
    this.transpose();
  }

  onInputChange(): void {
    this.transpose();
  }

  loadSample(): void {
    this.inputText = this.sampleText;
    this.transpose();
  }

  private transpose(): void {
    if (!this.inputText) {
      this.transposedText = '';
      return;
    }

    if (this.semitones === 0) {
      this.transposedText = this.inputText;
      return;
    }

    const noteMap = this.useFlats ? FLAT_NOTES : SHARP_NOTES;

    this.transposedText = this.inputText.replace(CHORD_REGEX, (match, root, accidental, _quality, bassRoot, bassAccidental) => {
      const rootNote = root + (accidental || '');
      const semitone = NOTE_TO_SEMITONE[rootNote];

      if (semitone === undefined) return match;

      const newSemitone = ((semitone + this.semitones) % 12 + 12) % 12;
      let newRoot = noteMap[newSemitone];

      let result = match.replace(rootNote, newRoot);

      if (bassRoot) {
        const bassNote = bassRoot + (bassAccidental || '');
        const bassSemitone = NOTE_TO_SEMITONE[bassNote];
        if (bassSemitone !== undefined) {
          const newBassSemitone = ((bassSemitone + this.semitones) % 12 + 12) % 12;
          const newBass = noteMap[newBassSemitone];
          result = result.replace('/' + bassNote, '/' + newBass);
        }
      }

      return result;
    });
  }

  getKeyLabel(): string {
    if (this.semitones === 0) return 'Original key';
    const direction = this.semitones > 0 ? 'up' : 'down';
    const steps = Math.abs(this.semitones);
    return `${steps} semitone${steps !== 1 ? 's' : ''} ${direction}`;
  }
}
