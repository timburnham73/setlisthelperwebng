import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog as MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Subject, take, takeUntil } from 'rxjs';
import { Lyric } from 'src/app/core/model/lyric';
import { Song } from 'src/app/core/model/song';
import { BaseUser, UserHelper } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { LyricsService } from 'src/app/core/services/lyrics.service';
import { SongService } from 'src/app/core/services/song.service';
import { AccountState } from 'src/app/core/store/account.state';
import { CONFIRM_DIALOG_RESULT, ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { NgIf } from '@angular/common';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@Component({
    selector: 'app-lyrics-edit',
    templateUrl: './lyrics-edit.component.html',
    styleUrls: ['./lyrics-edit.component.css'],
    standalone: true,
    imports: [MatCardModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, FormsModule, ReactiveFormsModule, MatProgressSpinnerModule, NgIf, FlexLayoutModule]
})
export class LyricsEditComponent implements OnDestroy {
  @ViewChild('lyrics') lyricsInput: ElementRef;
  currentUser: BaseUser;
  accountId?: string;
  songId?: string;
  lyricId?: string;
  song: Song;
  selectedLyric: Lyric;
  lyricsForm: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();
  
  get lyrics() { return this.lyricsForm.get('lyrics'); }
  constructor(private activeRoute: ActivatedRoute,
    private titleService: Title,
    private lyricsService: LyricsService,
    private songService: SongService,
    private store: Store,
    private authService: AuthenticationService,
    //private confirmDialog: ConfirmDialogComponent,
    private router: Router,
    public dialog: MatDialog) { 
      const selectedAccount = this.store.selectSnapshot(
        AccountState.selectedAccount
      );

      this.authService.user$.subscribe((user) => {
        if(user && user.uid){
          this.currentUser = UserHelper.getForUpdate(user);
        }
      });

      this.lyricsForm = new FormGroup({
        lyrics: new FormControl(this.selectedLyric?.name),
      });

      this.loading = true;
      activeRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.initLyrics();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initLyrics() {
    const accountId = this.activeRoute.snapshot.paramMap.get("accountid");
    const songId = this.activeRoute.snapshot.paramMap.get("songid");
    const lyricId = this.activeRoute.snapshot.paramMap.get("lyricsid");
    if (accountId && songId && lyricId) {
      this.accountId = accountId;
      this.songId = songId;
      this.lyricId = lyricId;
      this.songService
        .getSong(this.accountId, this.songId)
        .pipe(take(1))
        .subscribe((song) => {
          this.song = song;
        });

      this.lyricsService
        .getSongLyric(this.accountId, this.songId, this.lyricId)
        .pipe(take(1))
        .subscribe((lyric) => {
          this.selectedLyric = lyric;
          const lyricsTextArea = this.lyricsForm.get("lyrics");
          lyricsTextArea?.setValue(this.selectedLyric.lyrics);
          this.loading = false;
        });
    }
  }

  onSaveSong(){
    this.selectedLyric.lyrics = this.lyrics?.value;
    this.lyricsService.updateLyric(this.accountId!, this.songId!, this.selectedLyric, this.currentUser).subscribe((result) => {
      this.router.navigate([`../../../lyrics/${this.selectedLyric?.id}`], { relativeTo: this.activeRoute });
    });
  }

  insertTitle() {
    const name = this.song?.name || '';
    this.insertChordProText(`{title:${name}}`, 7 + name.length);
  }

  insertArtist() {
    const artist = this.song?.artist || '';
    this.insertChordProText(`{subtitle:${artist}}`, 10 + artist.length);
  }

  insertKey() {
    const key = this.selectedLyric?.key || '';
    this.insertChordProText(`{key:${key}}`, 5 + key.length);
  }

  insertTempo() {
    const tempo = this.selectedLyric?.tempo ? String(this.selectedLyric.tempo) : '';
    this.insertChordProText(`{tempo:${tempo}}`, 7 + tempo.length);
  }

  insertChordProText(text: string, cursorOffset: number) {
    // Try both textarea IDs (desktop and mobile)
    const textarea = (document.getElementById('lyrics') || document.getElementById('lyrics-mobile')) as HTMLTextAreaElement;
    const lyricsControl = this.lyricsForm.get('lyrics');
    const currentValue = lyricsControl?.value || '';
    const cursorPos = textarea?.selectionStart ?? currentValue.length;

    const before = currentValue.substring(0, cursorPos);
    const after = currentValue.substring(cursorPos);
    const newValue = before + text + after;

    lyricsControl?.setValue(newValue);
    lyricsControl?.markAsDirty();

    // Position cursor within the inserted text
    const newCursorPos = cursorPos + cursorOffset;
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
      }
    });
  }

  onCancel(){
    if(this.lyricsForm.dirty){
      let message = "You will loose your changes if you do not save. Are you sure you want to go back?";
      let message2 = "";
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { title: "Changes", message: message, message2, okButtonText: "Yes", cancelButtonText: "Cancel"},
        panelClass: "dialog-responsive",
        width: '300px',
        enterAnimationDuration: '200ms', 
        exitAnimationDuration: '200ms',
        
      })
      .afterClosed().subscribe((data) => {
        if(data && data.result === CONFIRM_DIALOG_RESULT.OK){
          this.router.navigate([`../../../lyrics/${this.selectedLyric?.id}`], { relativeTo: this.activeRoute });    
        }
      });
    }
    else {
      this.router.navigate([`../../../lyrics/${this.selectedLyric?.id}`], { relativeTo: this.activeRoute });    
    }
  }

}
