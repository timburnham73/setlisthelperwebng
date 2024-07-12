import { Component } from '@angular/core';
import { LyricsComponent } from '../lyrics-view/lyrics.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgIf, NgFor } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexModule, FlexLayoutModule } from 'ngx-flexible-layout';
import { SafeHtml } from 'src/app/shared/pipes/safe-html.pipe';
import { Song } from 'src/app/core/model/song';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, take } from 'rxjs';
import { AccountState } from 'src/app/core/store/account.state';
import { SongService } from 'src/app/core/services/song.service';
import { Store } from '@ngxs/store';
import { Account } from 'src/app/core/model/account';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ChordProParser } from "src/app/core/services/ChordProParser";
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/core/model/user';
import { LyricsService } from 'src/app/core/services/lyrics.service';
import { FormatScope, Lyric } from 'src/app/core/model/lyric';
import { LyricFormat, fonts, lyricParts } from 'src/app/core/model/lyric-format';

@Component({
  selector: 'app-lyric-view-wrapper',
  standalone: true,
  imports: [
    LyricsComponent,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    NgIf,
    MatFormFieldModule,
    MatSelectModule,
    NgFor,
    MatOptionModule,
    MatButtonModule,
    MatMenuModule,
    SafeHtml,
    FlexModule,
    FlexLayoutModule],
  templateUrl: './lyric-view-wrapper.component.html',
  styleUrl: './lyric-view-wrapper.component.scss'
})
export class LyricViewWrapperComponent {
  loading: boolean;
  currentUser: User;
  
  selectedAccount: Account;

  allSongs?: Song[];

  song?: Song;
  accountId: string;
  songId?: string;
  lyricId?: string;
  setlistId?: string;

  lyricVersionValue = "add";
  lyrics: Lyric[];
  selectedLyric?: Lyric;
  parsedLyric?: string;
  defaultLyricId: string | undefined;
  isDefaultLyric = false;
  lyricFormat: LyricFormat;
  formatScope: FormatScope;
  
  selectedFontSize: string = "medium";
  selectedFontStyle: string[] = [];
  selectedFont: string = "Arial";
  fonts = fonts;
  
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private store: Store,
    private userService: UserService,
    private authService: AuthenticationService,
    private lyricsService: LyricsService,
    private songService: SongService){
      this.selectedAccount = this.store.selectSnapshot(
        AccountState.selectedAccount
      );

      if(this.selectedAccount && this.selectedAccount.id){
        this.accountId = this.selectedAccount.id;
        this.songService.getSongs(this.selectedAccount.id, "name")
          .pipe(take(1))
          .subscribe((songs) => {
            this.allSongs = songs;
          });
      }

      this.authService.user$.pipe(
        switchMap((user) =>
          this.userService.getUserById(user.uid)
        ))
        .subscribe((user) => {
          if (user && user.uid) {
            this.currentUser = user;
            this.initLyrics();
          }
        });
    
        //The version can change on the page. This will subscribe to the page change event
        //Normally navigating to the same component is not supported. 
        //I added the onSameUrlNavigation: 'reload' on the router config.
        activeRoute.params.subscribe(params => {
          this.initLyrics();
        });
  }

  private initLyrics() {
    this.loading = true;
    const songId = this.activeRoute.snapshot.paramMap.get("songid");
    this.lyricId = this.activeRoute.snapshot.paramMap.get("lyricid") || undefined;
    this.setlistId = this.activeRoute.snapshot.paramMap.get("setlistid") || undefined;
    if (this.accountId && songId) {
      this.accountId = this.accountId;
      
      this.songService
        .getSong(this.accountId, songId)
        .pipe(take(1))
        .subscribe((song) => {
          this.song = song;
          this.defaultLyricId = this.getDefaultLyricId(); 
        });

      this.lyricsService
        .getSongLyrics(this.accountId, songId)
        .pipe(take(1))
        .subscribe((lyrics) => {
          this.lyrics = lyrics;
          this.isDefaultLyric = this.isDefaultLyricSelected();

          this.selectedLyric = this.getSelectedLyric(lyrics);

          if(this.selectedLyric && this.selectedLyric.lyrics){
            //Create a function to select 
            const lyricFormatWithScope = this.lyricsService.getLyricFormat(this.selectedAccount, this.currentUser, this.selectedLyric!.formatSettings);
            this.formatScope = lyricFormatWithScope.formatScope;
            this.lyricFormat = lyricFormatWithScope.lyricFormat;
            
            const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, this.selectedLyric?.transpose!);
            this.parsedLyric = parser.parseChordPro();
          }
          
          this.loading = false;
          this.lyricVersionValue = this.selectedLyric?.id || "add";
        });

        
    }
  }

  onPageLeft(){
    const currentSongIndex = this.allSongs ? this.allSongs?.findIndex(song => song.id === this.song?.id) : -1;
    
    if(this.allSongs && currentSongIndex-1 < this.allSongs?.length){
      if(this.allSongs && this.allSongs?.length > currentSongIndex-1){
        const previousSong = this.allSongs[currentSongIndex - 1];
        this.router.navigate([`../../${previousSong?.id}/lyrics`], { relativeTo: this.activeRoute });
      }
    }
  }

  onPageRight(){
    const currentSongIndex = this.allSongs ? this.allSongs?.findIndex(song => song.id === this.song?.id) : -1;
    
    if(this.allSongs && currentSongIndex+1 < this.allSongs?.length){
      if(this.allSongs && this.allSongs?.length > currentSongIndex+1){
        const nextSong = this.allSongs[currentSongIndex + 1];
        this.router.navigate([`../../${nextSong?.id}/lyrics`], { relativeTo: this.activeRoute });
      }
    }
  }

  private getDefaultLyricId(){
    if (this.song?.defaultLyricForUser) {
      return this.song?.defaultLyricForUser.find((userLyric) => userLyric.uid === this.currentUser.uid)?.lyricId;
    }
    return undefined;
  }

  private isDefaultLyricSelected(){    
      return this.defaultLyricId === this.selectedLyric?.id;
  }
  
  private getSelectedLyric(lyrics: any) {
    //If the lyric id is NOT passed in on the url 
    if (!this.lyricId) {
      if (this.song?.defaultLyricForUser) {
        const userLyric = this.song?.defaultLyricForUser.find((userLyric) => userLyric.uid === this.currentUser.uid);
        if (userLyric) {
          const selecteLyric = lyrics.find((lyric) => lyric.id === userLyric.lyricId);
          return selecteLyric ? selecteLyric : lyrics[0];
        }
      }
    } else {
      //If the lyric is not passed in with the URL find the default lyrics or first lyric.
      const selectedLyric = lyrics.find((lyric) => lyric.id === this.lyricId);
      return selectedLyric ? selectedLyric : lyrics[0];
    }
    return lyrics[0];
  }

  
}
