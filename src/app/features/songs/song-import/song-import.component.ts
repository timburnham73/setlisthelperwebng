import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { Song } from 'src/app/core/model/song';
import { SongService } from 'src/app/core/services/song.service';
import { MatButtonModule } from '@angular/material/button';
import { NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseUser, UserHelper } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { SongAttribute } from 'src/app/core/viewModel/song-attribute';
import { Store } from '@ngxs/store';
import { AccountState } from 'src/app/core/store/account.state';
import { getEntitlementLimits } from 'src/app/core/model/entitlement-limits';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
    selector: 'app-song-import',
    templateUrl: './song-import.component.html',
    styleUrls: ['song-import.component.css'],
    standalone: true,
    imports: [MatCardModule, FormsModule, ReactiveFormsModule, NgIf, MatButtonModule, NgFor, MatSelectModule, MatOptionModule, MatProgressSpinnerModule]
})
export class SongImportComponent implements OnInit {
  public stepNumber = 1;
  currentUser: BaseUser;
  public importSongsResult = '';
  public importing = false;
  public categories: any[] = [];
  public accountId: string;
  private delimiter: string;
  private songLines: string[];
  public songFieldTypes: SongAttribute[] = [
    { displayName: 'Name', attribute: 'name' },
    { displayName: 'Artist', attribute: 'artist' },
    { displayName: 'Genre', attribute: 'genre' },
    { displayName: 'Song Key', attribute: 'key' },
    { displayName: 'Song Length', attribute: 'songLength' },
    { displayName: 'Tempo', attribute: 'tempo' },
    { displayName: 'Notes', attribute: 'notes' },
    { displayName: 'Other', attribute: 'other' }
  ];
  public multiSongForm: FormGroup;
  public songAttributeForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private songService: SongService,
    private authService: AuthenticationService,
    private store: Store,
    private notificationService: NotificationService,
    private router: Router) {

    this.accountId = this.route.snapshot.paramMap.get('accountid') ?? "";

    this.multiSongForm = new FormGroup({
      importText: new FormControl(),
    });

    this.authService.user$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = UserHelper.getForUpdate(user);
      }
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.accountId = params['accountid'];
    });
  }

  stepOneImport() {
    const csvText: string = this.multiSongForm.get('importText')?.value;
    if (csvText) {
      // Split lines and filter out empty lines
      this.songLines = csvText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (this.songLines.length > 0) {
        // Check entitlement limits
        const account = this.store.selectSnapshot(AccountState.selectedAccount);
        const limits = getEntitlementLimits(account?.entitlementLevel);
        if (limits.maxSongs !== null) {
          const currentCount = account?.countOfSongs ?? 0;
          const remaining = limits.maxSongs - currentCount;
          if (remaining <= 0) {
            this.notificationService.openSnackBar(
              `Your plan allows up to ${limits.maxSongs} songs. Upgrade your subscription to add more.`
            );
            return;
          }
          if (this.songLines.length > remaining) {
            this.notificationService.openSnackBar(
              `Your plan allows ${remaining} more song${remaining === 1 ? '' : 's'}. You are trying to import ${this.songLines.length}.`
            );
            return;
          }
        }

        if (this.songLines[0].indexOf(',') > -1) {
          this.delimiter = ',';
        } else if (this.songLines[0].indexOf('\t') > -1) {
          this.delimiter = '\t';
        }
        this.populateCategories(this.songLines, this.delimiter);
        this.stepNumber = 2;

        // Build form with auto-detected values prepopulated
        this.songAttributeForm = new FormGroup({});
        this.categories.forEach((category, index) => {
          const controlName = `col_${index}`;
          category.controlName = controlName;
          const detectedValue = category.type.attribute;
          this.songAttributeForm.addControl(controlName, new FormControl(detectedValue, Validators.required));
        });
        // Mark form as dirty since we prepopulated values
        this.songAttributeForm.markAsDirty();
      }
    }
  }

  stepTwoStartImport() {
    this.stepNumber = 3;
    this.importing = true;
    this.importSongs();
  }

  stepThreeFinish() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  async importSongs() {
    const artistNames = new Set<string>();
    const genreNames = new Set<string>();
    let successCount = 0;

    // Process songs sequentially to avoid race conditions
    for (let i = 0; i < this.songLines.length; i++) {
      const songItems = this.songLines[i].split(this.delimiter);
      const song = this.buildSongFromLine(songItems);

      if (!song.name || song.name.trim().length === 0) {
        this.importSongsResult += `Skipping empty line ${i + 1}\r\n`;
        continue;
      }

      this.importSongsResult += `Importing ${song.name}...\r\n`;

      try {
        const createdSong = await firstValueFrom(
          this.songService.addSongBulk(this.accountId, song, this.currentUser)
        );
        this.importSongsResult += `Created ${createdSong.name}\r\n`;
        successCount++;

        if (song.artist?.trim()) {
          artistNames.add(song.artist.trim());
        }
        if (song.genre?.trim()) {
          genreNames.add(song.genre.trim());
        }
      } catch (err) {
        this.importSongsResult += `Error creating ${song.name}: ${err}\r\n`;
      }
    }

    // Finalize: update song count and recompute artist/genre counts
    if (successCount > 0) {
      this.importSongsResult += `\r\nUpdating counts...\r\n`;
      try {
        await firstValueFrom(
          this.songService.finalizeBulkImport(this.accountId, successCount, artistNames, genreNames, this.currentUser)
        );
        this.importSongsResult += `Done! ${successCount} song${successCount === 1 ? '' : 's'} imported.\r\n`;
      } catch (err) {
        this.importSongsResult += `Error updating counts: ${err}\r\n`;
      }
    } else {
      this.importSongsResult += `No songs were imported.\r\n`;
    }

    this.importing = false;
  }

  buildSongFromLine(songLineArray: string[]): Song {
    const song = {} as Song;

    this.categories.forEach((category, index) => {
      const control = this.songAttributeForm.get(category.controlName);
      const attribute = control?.value; // The selected song field attribute
      const rawValue = (songLineArray[index] ?? '').trim();

      if (!attribute || attribute === 'other') return;

      if (attribute === 'songLength') {
        const p = rawValue.split(':');
        let s = 0, m = 1;
        while (p.length > 0) {
          s += m * parseInt(p.pop()!, 10);
          m *= 60;
        }
        song[attribute] = s;
      } else if (attribute === 'tempo') {
        song[attribute] = parseInt(rawValue, 10) || 0;
      } else {
        song[attribute] = rawValue;
      }
    });

    return song;
  }

  populateCategories(songLines: string[], delimiter: string) {
    if (songLines.length === 0) return;

    const previewCount = Math.min(3, songLines.length);
    const columns: string[][] = [];

    // Collect column values from preview lines
    for (let i = 0; i < previewCount; i++) {
      const items = songLines[i].split(delimiter).map(v => v.trim());
      for (let col = 0; col < items.length; col++) {
        if (!columns[col]) columns[col] = [];
        columns[col].push(items[col]);
      }
    }

    // Auto-detect field types for each column
    const usedAttributes = new Set<string>();

    this.categories = columns.map((values, index) => {
      const detected = this.detectFieldType(values, index, usedAttributes);
      usedAttributes.add(detected.attribute);
      return {
        type: detected,
        items: values,
        controlName: '' // set later in stepOneImport
      };
    });
  }

  private detectFieldType(values: string[], columnIndex: number, usedAttributes: Set<string>): SongAttribute {
    const MUSICAL_KEYS = new Set([
      'a', 'b', 'c', 'd', 'e', 'f', 'g',
      'ab', 'bb', 'cb', 'db', 'eb', 'fb', 'gb',
      'a#', 'b#', 'c#', 'd#', 'e#', 'f#', 'g#',
      'am', 'bm', 'cm', 'dm', 'em', 'fm', 'gm',
      'abm', 'bbm', 'cbm', 'dbm', 'ebm', 'fbm', 'gbm',
      'a#m', 'b#m', 'c#m', 'd#m', 'e#m', 'f#m', 'g#m'
    ]);

    const COMMON_GENRES = new Set([
      'rock', 'pop', 'jazz', 'blues', 'country', 'folk', 'r&b', 'hip hop', 'hip-hop',
      'soul', 'funk', 'reggae', 'classical', 'metal', 'punk', 'alternative', 'indie',
      'electronic', 'dance', 'latin', 'gospel', 'bluegrass', 'world', 'ska', 'swing',
      'disco', 'grunge', 'emo', 'rap', 'techno', 'house', 'ambient', 'new wave'
    ]);

    // Check if all values match a time format (e.g., 5:55, 1:02:30)
    if (!usedAttributes.has('songLength') && values.every(v => /^\d+:\d{2}(:\d{2})?$/.test(v))) {
      return { displayName: 'Song Length', attribute: 'songLength' };
    }

    // Check if all values are purely numeric (likely tempo)
    if (!usedAttributes.has('tempo') && values.every(v => /^\d+$/.test(v))) {
      const nums = values.map(v => parseInt(v, 10));
      if (nums.every(n => n >= 30 && n <= 300)) {
        return { displayName: 'Tempo', attribute: 'tempo' };
      }
    }

    // Check if all values look like musical keys
    if (!usedAttributes.has('key') && values.every(v => MUSICAL_KEYS.has(v.toLowerCase()))) {
      return { displayName: 'Song Key', attribute: 'key' };
    }

    // Check if values match common genres
    if (!usedAttributes.has('genre') && values.every(v => COMMON_GENRES.has(v.toLowerCase()))) {
      return { displayName: 'Genre', attribute: 'genre' };
    }

    // First column is usually the song name
    if (columnIndex === 0 && !usedAttributes.has('name')) {
      return { displayName: 'Name', attribute: 'name' };
    }

    // Second column is usually the artist
    if (columnIndex === 1 && !usedAttributes.has('artist')) {
      return { displayName: 'Artist', attribute: 'artist' };
    }

    // Third column — if not already detected, guess genre
    if (columnIndex === 2 && !usedAttributes.has('genre')) {
      return { displayName: 'Genre', attribute: 'genre' };
    }

    // Fallback to position-based default or 'other'
    if (columnIndex < this.songFieldTypes.length && !usedAttributes.has(this.songFieldTypes[columnIndex].attribute)) {
      return this.songFieldTypes[columnIndex];
    }

    return { displayName: 'Other', attribute: 'other' };
  }
}
