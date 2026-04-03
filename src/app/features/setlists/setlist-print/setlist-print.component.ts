import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { Setlist } from 'src/app/core/model/setlist';
import { SetlistSong } from 'src/app/core/model/setlist-song';
import { User } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SetlistSongService } from 'src/app/core/services/setlist-songs.service';
import { PrintColumns, SetlistService } from 'src/app/core/services/setlist.service';
import { AccountState } from 'src/app/core/store/account.state';
import { defaultPrintSettings, SetlistPrintSettings, FONT_OPTIONS, FONT_SIZE_OPTIONS } from 'src/app/core/model/setlist-print-settings';
import { take } from 'rxjs';

@Component({
  selector: 'app-setlist-print',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatSelectModule,
    FormsModule,
    FlexLayoutModule,
    DatePipe,
  ],
  templateUrl: './setlist-print.component.html',
  styleUrl: './setlist-print.component.scss'
})
export class SetlistPrintComponent {
  currentUser: User;
  accountId: string;
  setlistId: string;
  setlist?: Setlist;
  setlistSongs: SetlistSong[];
  setlistPrintSettings: SetlistPrintSettings | undefined;
  columns = PrintColumns.one;
  loading: boolean;
  showSettings = false;
  totalDuration = '';
  fontOptions = FONT_OPTIONS;
  fontSizeOptions = FONT_SIZE_OPTIONS;

  public get PrintColumns(): typeof PrintColumns {
    return PrintColumns;
  }

  constructor(
    private setlistSongsService: SetlistSongService,
    private setlistService: SetlistService,
    private authService: AuthenticationService,
    private store: Store,
    private activeRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.authService.user$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = user;
      }
    });

    this.loading = true;

    const accountId = this.activeRoute.snapshot.paramMap.get("accountid");
    const setlistId = this.activeRoute.snapshot.paramMap.get("setlistid");
    if (accountId && setlistId) {
      this.accountId = accountId;
      this.setlistId = setlistId;
      this.setlistService.getSetlist(this.accountId, this.setlistId)
        .subscribe((setlist) => {
          this.loading = false;
          this.setlist = setlist;
        });

      this.setlistService
        .getSetlistPrintSettings(accountId, setlistId)
        .pipe(take(1))
        .subscribe((printsettings) => {
          if (printsettings && printsettings.length > 0) {
            // Merge saved settings with defaults for any new fields
            this.setlistPrintSettings = { ...defaultPrintSettings, ...printsettings[0] };
          } else {
            this.setlistPrintSettings = { ...defaultPrintSettings };
          }
          this.columns = this.setlistPrintSettings.columns;
        });

      this.setlistSongsService
        .getOrderedSetlistSongs(accountId, setlistId)
        .subscribe((setlistSongs) => {
          this.setlistSongs = setlistSongs.map((song, index) => {
            let breakCount = setlistSongs.slice(0, index).filter(s => s.isBreak === true).length;
            const sequenceNumber = (index + 1) - breakCount;
            if (!song.isBreak) {
              return { ...song, sequenceNumber: sequenceNumber };
            }
            return { ...song, sequenceNumber: sequenceNumber + .01 };
          });
          this.calculateDuration();
        });
    }
  }

  private calculateDuration(): void {
    if (!this.setlistSongs) return;
    const totalSeconds = this.setlistSongs.reduce((sum, song) => sum + (song.songLength || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      this.totalDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.totalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  onPrintSetlist() {
    window.print();
  }

  onBackToSetlist() {
    this.router.navigate(["../songs"], { relativeTo: this.activeRoute });
  }

  onChangePrintColumn(columns: PrintColumns) {
    if (this.setlistPrintSettings) {
      this.setlistPrintSettings.columns = columns;
      this.saveSettings();
    }
  }

  onToggleSettings() {
    this.showSettings = !this.showSettings;
  }

  onSettingChanged() {
    this.saveSettings();
  }

  private saveSettings() {
    if (this.setlistPrintSettings) {
      this.setlistService.setPrintSettings(this.accountId, this.setlistId, this.setlistPrintSettings)
        .subscribe((result) => {
          this.setlistPrintSettings = result;
        });
    }
  }
}
