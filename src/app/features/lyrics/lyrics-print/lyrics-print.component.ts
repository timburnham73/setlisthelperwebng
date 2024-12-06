import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, Input, LOCALE_ID } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { Lyric } from 'src/app/core/model/lyric';
import { User } from 'src/app/core/model/user';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { LyricsService, PrintColumns } from 'src/app/core/services/lyrics.service';
import { AccountState } from 'src/app/core/store/account.state';
import { ChordProParser } from "src/app/core/services/ChordProParser";
import { SafeHtml } from 'src/app/shared/pipes/safe-html.pipe';
import { SetlistPrintShowDialogComponent } from './lyrics-print-show-dialog/lyrics-print-show-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { LyricFormatWithScope } from 'src/app/core/model/lyric-format';
import { Account } from 'src/app/core/model/account';

@Component({
  selector: 'app-lyrics-print',
  standalone: true,
  imports: [
    MatToolbar,
    MatIcon,
    MatIconButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    SafeHtml,
    FlexLayoutModule,
    NgIf
  ],
  templateUrl: './lyrics-print.component.html',
  styleUrl: './lyrics-print.component.scss'
})
export class LyricsPrintComponent {
  currentUser: User;
  accountId: string;
  lyricsId: string;
  songId: string;
  lyrics?: Lyric;
  selectedAccount: Account;
  //lyricsPrintSettings: SetlistPrintSettings | undefined;
  columns = PrintColumns.one;
  loading: boolean;
  @Input()
  parsedLyric?: string;
  lyricFormatWithScope: LyricFormatWithScope;
  
  public get PrintColumns(): typeof PrintColumns {
    return PrintColumns; 
  }

  constructor(
    private lyricsService: LyricsService,
    private authService: AuthenticationService,
    private store: Store,
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog,
    private router: Router,
  ){
    
    this.authService.user$.subscribe((user) => {
      if(user && user.uid){
        this.currentUser = user;
      }
    });

    this.selectedAccount = this.store.selectSnapshot(
      AccountState.selectedAccount
    );
    
    this.loading = true;

    const accountId = this.activeRoute.snapshot.paramMap.get("accountid");
    const lyricsId = this.activeRoute.snapshot.paramMap.get("lyricsid");
    const songId = this.activeRoute.snapshot.paramMap.get("songid");
    if (accountId && lyricsId && songId) {
      this.accountId = accountId;
      this.lyricsId = lyricsId;
      this.songId = songId;
      this.lyricsService.getSongLyric(this.accountId, this.songId, this.lyricsId)
                          .subscribe((lyrics: Lyric) => {
        this.loading = false;
        this.lyrics = lyrics;
        this.lyricFormatWithScope = this.lyricsService.getLyricFormat(this.selectedAccount, this.currentUser, lyrics!.formatSettings);
        const parser =  new ChordProParser(lyrics.lyrics!, this.lyricFormatWithScope.lyricFormat, lyrics!.transpose);
        this.parsedLyric = parser.parseChordPro();
      });
    }
  }

  onPrintSetlist(){
    let printContents = document?.getElementById("lyrics")?.innerHTML;
     let originalContents = document.body.innerHTML;

     if(document && document.body && document.body.innerHTML && printContents){
        document.body.innerHTML = printContents;
        window.print();

        document.body.innerHTML = originalContents;
        window.location.reload();
     }
  }

  onBackToSetlist(){
    this.router.navigate(["../.."], { relativeTo: this.activeRoute });   
  }

  onChangePrintColumn(columns: PrintColumns){
    /*if(this.lyricsPrintSettings){
    this.lyricsPrintSettings.columns = columns;
    
    this.lyricsService.getSongLyric(this.accountId, this.lyricsId, this.lyricsPrintSettings)
      .subscribe((result)=> {
        this.lyricsPrintSettings = result;
      });
    }*/
  }

  onSetVisibleElements(){
    /*const dialogRef = this.dialog.open(SetlistPrintShowDialogComponent, {
      data: { accountId: this.accountId, lyrics: this.lyrics, printSettings: this.lyricsPrintSettings},
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((printSettings) => {
      if(printSettings){
        this.lyricsPrintSettings = printSettings;
      }
    });*/
  }

}

