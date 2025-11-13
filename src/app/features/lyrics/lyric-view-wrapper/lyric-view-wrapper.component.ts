import { Component } from '@angular/core';
import { LyricsComponent } from '../lyrics-view/lyrics.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NgIf, NgFor, CommonModule } from '@angular/common';
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
import { switchMap, take, filter, tap } from 'rxjs';
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
import { LyricFormat, LyricFormatWithScope, fonts, lyricParts } from 'src/app/core/model/lyric-format';
import { SetlistSongService } from 'src/app/core/services/setlist-songs.service';
import { SetlistSong } from 'src/app/core/model/setlist-song';
import { SwipeDirective } from 'src/app/shared/directives/swipe/swipe.directive';

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
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    MatOptionModule,
    MatButtonModule,
    MatMenuModule,
    SafeHtml,
    SwipeDirective,
    FlexModule,
    FlexLayoutModule],
  templateUrl: './lyric-view-wrapper.component.html',
  styleUrl: './lyric-view-wrapper.component.scss'
})
export class LyricViewWrapperComponent {
  loading: boolean;
  currentUser: User;
  
  selectedAccount: Account;

  allSongs?: Song[] | SetlistSong[];
  currentSongIndex = 0;

  song?: Song | SetlistSong;
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
  lyricFormatWithScope: LyricFormatWithScope;
  
  
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
    private songService: SongService,
    private setlistSongService: SetlistSongService
  ){
      this.selectedAccount = this.store.selectSnapshot(
        AccountState.selectedAccount
      );
      
      this.loading = false;

      if(this.selectedAccount && this.selectedAccount.id){
        this.setlistId = this.activeRoute.snapshot.paramMap.get("setlistid") || undefined;
        this.accountId = this.selectedAccount.id;
        if(this.setlistId){
          this.setlistSongService
            .getOrderedSetlistSongs(this.accountId!, this.setlistId)
            .subscribe((setlistSongs) => {
              this.allSongs = setlistSongs;
            });
        }
        else{
          this.songService.getSongs(this.selectedAccount.id, "name")
            .pipe(take(1))
            .subscribe((songs) => {
              this.allSongs = songs;
            });
        }
      }

      this.authService.user$
        .pipe(
          filter((authUser) => !!authUser && !!authUser.uid),
          take(1),
          switchMap((authUser) => this.userService.getUserById(authUser.uid).pipe(take(1))),
          tap((user) => {
            if (user && user.uid) {
              this.currentUser = user;
              this.initLyrics();
            }
          }),
          switchMap(() => this.activeRoute.params)
        )
        .subscribe(() => {
          this.initLyrics();
        });
  }

  private initLyrics() {
    this.loading = false;
    const songId = this.activeRoute.snapshot.paramMap.get("songid");
    this.lyricId = this.activeRoute.snapshot.paramMap.get("lyricsid") || undefined;
    
    if (this.accountId && songId) {
      this.accountId = this.accountId;
      
      this.songService
        .getSong(this.accountId, songId)
        .pipe(take(1))
        .subscribe((song) => {
          this.song = song;
          this.defaultLyricId = this.getDefaultLyricId(); 
          this.currentSongIndex = this.getCurrentSongIndex();
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
            this.lyricFormatWithScope = this.lyricsService.getLyricFormat(this.selectedAccount, this.currentUser, this.selectedLyric!.formatSettings);
            
            const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormatWithScope.lyricFormat, this.selectedLyric?.transpose!);
            this.parsedLyric = parser.parseChordPro();
          }
          
          this.loading = false;
          this.lyricVersionValue = this.selectedLyric?.id || "add";
        });
    }
  }

  onPageLeft(){
    this.currentSongIndex = this.getCurrentSongIndex();
    
    if(this.allSongs && this.currentSongIndex-1 < this.allSongs?.length){
      if(this.allSongs && this.allSongs?.length > this.currentSongIndex-1){
        const previousSong = this.allSongs[this.currentSongIndex - 1];
        const previousSongId = this.setlistId ? previousSong["songId"] : previousSong.id;
        if(this.lyricId){
          this.router.navigate([`../../../${previousSongId}/lyrics`], { relativeTo: this.activeRoute });
        }
        else{
          this.router.navigate([`../../${previousSongId}/lyrics`], { relativeTo: this.activeRoute });
        }
      }
    }
  }

  onPageRight(){
    this.currentSongIndex = this.getCurrentSongIndex();
    
    if(this.allSongs && this.currentSongIndex+1 < this.allSongs?.length){
      if(this.allSongs && this.allSongs?.length > this.currentSongIndex+1){
        const nextSong = this.allSongs[this.currentSongIndex + 1];
        const nextSongId = this.setlistId ? nextSong["songId"] : nextSong.id;
        if(this.lyricId){
          this.router.navigate([`../../../${nextSongId}/lyrics`], { relativeTo: this.activeRoute });
        }
        else{
          this.router.navigate([`../../${nextSongId}/lyrics`], { relativeTo: this.activeRoute });
        }
      }
    }
  }

  public shouldShowPageIcon(isNext = true){
    const songsLength = this.allSongs ? this.allSongs?.length : 0;
    if(isNext){
      
      return songsLength > this.currentSongIndex + 1;
    }
    else{
      return this.currentSongIndex - 1 >= 0;
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

  //Used to get the song ID. If it is a setlist song then use the songId otherwise use id.
  private getCurrentSongIndex() {
    const currentSongId = this.song?.id;
    const currentSongIndex = this.allSongs ? this.allSongs?.findIndex(song => {
      let songId = song.id;
      if(this.setlistId && song){
        songId = song["songId"];
      }
      return songId === currentSongId;
    }) : -1;
    return currentSongIndex;
  }
  
}
