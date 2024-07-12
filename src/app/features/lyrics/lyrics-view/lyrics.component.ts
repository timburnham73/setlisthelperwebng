import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatTableDataSource as MatTableDataSource } from "@angular/material/table";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { AccountLyric, FormatScope, Lyric } from "src/app/core/model/lyric";
import { LyricsService } from "src/app/core/services/lyrics.service";
import { SongService } from "src/app/core/services/song.service";
import { AccountState } from "src/app/core/store/account.state";
import { LyricAddDialogComponent } from "../lyric-add-dialog/lyric-add-dialog.component";
import { MatDialog as MatDialog } from "@angular/material/dialog";
import { Song } from "src/app/core/model/song";
import { switchMap, take } from "rxjs";
import { FormControl } from "@angular/forms";
import { AuthenticationService } from "src/app/core/services/auth.service";
import { MatOptionModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgIf, NgFor } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import ChordSheetJS, { HtmlTableFormatter } from 'chordsheetjs';
import { parse } from "path";
import { LyricFormat, LyricFormatHelper, LyricFormatWithScope, fontSizes, fonts, lyricParts } from "src/app/core/model/lyric-format";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { ChordProParser } from "src/app/core/services/ChordProParser";
import { LyricDisplaySetting } from "src/app/core/model/LyricDisplaySetting";
import { SafeHtml } from "src/app/shared/pipes/safe-html.pipe";
import { MatMenu, MatMenuModule } from "@angular/material/menu";
import { UserService } from "src/app/core/services/user.service";
import { user } from "@angular/fire/auth";
import { User, UserHelper } from "src/app/core/model/user";
import { AccountService } from "src/app/core/services/account.service";
import { Account } from "src/app/core/model/account";
import { FlexLayoutModule, FlexModule } from "ngx-flexible-layout";
import { LyricsFormatDialogComponent } from "../lyrics-format-dialog/lyrics-format-dialog.component";

@Component({
    selector: "app-lyrics",
    templateUrl: "./lyrics.component.html",
    styleUrls: ["./lyrics.component.scss"],
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
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
        FlexLayoutModule
    ],
})
export class LyricsComponent {
  @ViewChild('lyricSection') lyricSection;
  @ViewChild('toggleFontStyle') toggleFontStyle;
  
  selectedAccount: Account;
  
  @Input()
  song?: Song;
  
  @Input()
  lyrics: Lyric[];

  @Input()
  defaultLyricId: string | undefined;

  @Input()
  selectedLyric?: Lyric;

  @Input()
  parsedLyric?: string;
  

  selectedFontStyle: string[] = [];
  selectedFont: string = "Arial";
  fonts = fonts;

  selectedLyricPart: string = "lyric";
  lyricParts = lyricParts;
  

  selectedFontSize: string = "medium";
  fontSizes = fontSizes;

  
  get isDefaultLyric(): boolean {
    return this.defaultLyricId === this.selectedLyric?.id;
  }
  
  
  lyricVersionValue = "add";
  
  lyricVersions = new FormControl("");
  currentUser: User;
  

  isTransposing = false;
  isFormatting = false;

  lyricFormat: LyricFormat;
  formatScope: FormatScope;
  //Used in the UI so the FormatScope enum can be used
  FormatScopeType = FormatScope;
  
  constructor(
    private activeRoute: ActivatedRoute,
    private titleService: Title,
    private lyricsService: LyricsService,
    private songService: SongService,
    private userService: UserService,
    private accountService: AccountService,
    private store: Store,
    private router: Router,
    public dialog: MatDialog,
    
    
  ) {
    this.selectedAccount = this.store.selectSnapshot(
      AccountState.selectedAccount
    );
  }

  
  onAddLyric(event?) {
    event?.preventDefault();
    const accountLyric = {
      accountId: this.selectedAccount.id,
      songId: this.song?.id,
      createdByUserId: this.currentUser.uid,
    };
    const dialogRef = this.dialog.open(LyricAddDialogComponent, {
      data: { accountLyric: accountLyric, countOfLyrics: this.lyrics.length },
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((result: Lyric) => {
      if (result) {
        this.selectedLyric = result;
        this.onEditLyric();
      }{
        this.lyricVersionValue = this.selectedLyric?.id || "add";
      }
    });
  }

  onEditLyric() {
    if(this.selectedLyric?.id){
        this.router.navigate([`../${this.selectedLyric?.id}/edit`], {
          relativeTo: this.activeRoute,
        });
      }
      else{
        this.router.navigate([`${this.selectedLyric?.id}/edit`], {
          relativeTo: this.activeRoute,
        });
      }
  }
  
  

  onFormatLyrics(){
    this.updateToolbarFromLyricFont();
    this.isFormatting = !this.isFormatting;
  }
  
  onFormatMobileLyrics(){
    const lyricFormats = {
      formatScope: this.formatScope,
      lyricFormat: this.lyricFormat
    } as LyricFormatWithScope;

    const dialogRef = this.dialog.open(LyricsFormatDialogComponent, {
      data: lyricFormats ,
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((result: LyricFormatWithScope) => {
      if (result) {
        this.formatScope = result.formatScope;
        this.lyricFormat = result.lyricFormat;
        this.saveFormatSettings();

        const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, this.selectedLyric!.transpose);
        this.parsedLyric = parser.parseChordPro();
      }
    });
  }

  onTranspose(){
    this.isTransposing = !this.isTransposing;
  }
  
  onTransposeLyric(transposeDown: boolean){
    if(this.selectedLyric){
      let transposeNumber = this.selectedLyric!.transpose
      if(!transposeNumber){
        transposeNumber = 0;
      }
      if(transposeDown){
        transposeNumber += -1;
      }
      else{
        transposeNumber += 1;
      }

      this.selectedLyric!.transpose = transposeNumber;
      this.selectedLyric.formatSettings = this.lyricFormat;
      this.lyricsService.updateLyric(this.selectedAccount.id!, this.song?.id!, this.selectedLyric, this.currentUser);
      
      const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, transposeNumber);
      this.parsedLyric = parser.parseChordPro();
      
    }
  }

  onSetDefaultUser(event: Event){
    this.songService.setDefaultLyricForUser(this.selectedAccount.id!, this.song!, this.selectedLyric?.id!, this.currentUser).subscribe(
      () => {
        this.defaultLyricId = this.selectedLyric?.id;
      }
    );
  }

  onSelectLyricPart(fontname: string) {
    this.updateToolbarFromLyricFont();
  }

  onSelectFormatScope(formatScope: FormatScope){
    this.formatScope = formatScope;
    this.saveFormatSettings();
  }

  onSelectFont(fontname: string) {
    this.lyricFormat.font = fontname;
    const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, this.selectedLyric!.transpose);
    this.parsedLyric = parser.parseChordPro();
    this.saveFormatSettings();
  }
  
  //Bold, Italic, or Underline
  onFormatToggleStyle(selectedFontStyle){
    const lyricPart = this.lyricFormat.lyricPartFormat.find(lyricPart => this.selectedLyricPart === lyricPart.lyricPart);
    if(lyricPart){
      lyricPart.isBold = selectedFontStyle.find(fontStyle => fontStyle === "bold") ? true : false;
      lyricPart.isItalic = selectedFontStyle.find(fontStyle => fontStyle === "italic") ? true : false;
      lyricPart.isUnderlined = selectedFontStyle.find(fontStyle => fontStyle === "underline") ? true : false;
    }

    const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, this.selectedLyric!.transpose);
    this.parsedLyric = parser.parseChordPro();

    this.saveFormatSettings();
  }

  onSelectFontSize(fontSize: string) {
    const lyricPart = this.lyricFormat.lyricPartFormat.find(lyricPart => this.selectedLyricPart === lyricPart.lyricPart);
    if(lyricPart){
      lyricPart.fontSize = fontSize;
    }
    const parser =  new ChordProParser(this.selectedLyric?.lyrics!, this.lyricFormat, this.selectedLyric!.transpose);
    this.parsedLyric = parser.parseChordPro();

    this.saveFormatSettings();
  }

  private saveFormatSettings() {
    if(this.formatScope === FormatScope.LYRIC) {
      if(this.selectedLyric){
        this.selectedLyric.formatSettings = this.lyricFormat;
        this.lyricsService.updateLyric(this.selectedAccount.id!, this.song?.id!, this.selectedLyric!, this.currentUser);
      }
    }
    else if(this.formatScope === FormatScope.USER) {
      this.clearLyricFormatSettings();
      //set the User formatSettings
      this.currentUser.formatSettings = this.lyricFormat;
      if (this.currentUser.id) {
        this.userService.updateUser(this.currentUser.id, UserHelper.getForUpdate(this.currentUser));
      }
    }
    else if(this.formatScope === FormatScope.ACCOUNT){
      this.clearLyricFormatSettings();
      this.clearUserFormatSettings();
      this.selectedAccount.formatSettings = this.lyricFormat;
      this.accountService.updateAccount(this.selectedAccount.id!, this.currentUser, this.selectedAccount);
    }
  }

  private clearLyricFormatSettings(){
    //Remove the lyric formatSettings if it was set previously. 
    if(this.selectedLyric && this.selectedLyric.formatSettings){
      this.lyricsService.deleteFormatSettingsUser(this.selectedAccount.id!, this.song?.id!, this.selectedLyric!.id!);
    }
  }
  private clearUserFormatSettings(){
    //Remove format settings for the user. 
    if(this.currentUser.formatSettings){
      if (this.currentUser.id) {
        this.userService.deleteFormatSettingsUser(this.currentUser.id);
      }
    }
  }

  //When the lyric part changes in the dropdown this function will up date the state of the toolbar.
  private updateToolbarFromLyricFont() {
    const selectedLyricPart = this.lyricFormat.lyricPartFormat.find(lyricPart => lyricPart.lyricPart === this.selectedLyricPart);
    const newSelectedForntStyle: string[] = [];
    if (selectedLyricPart) {
      if(selectedLyricPart.isBold){
        newSelectedForntStyle.push('bold');
      }
      if(selectedLyricPart.isItalic){
        newSelectedForntStyle.push('italic');
      }
      if(selectedLyricPart.isUnderlined){
        newSelectedForntStyle.push('underline');
      }
      //Setting bold, italic, and/or underline
      this.selectedFontStyle = newSelectedForntStyle;
      //Font size for the lyric part. 
      this.selectedFontSize = selectedLyricPart.fontSize;
    }
    
    //Global font name
    this.selectedFont = this.lyricFormat.font;
  }

  onSelectLyric(value: string) {
    if (value === "add") {
      this.onAddLyric();
    } else {
      //Switch to another lyrics. If there is no lyric id the route is different. 
      //You may get here without a lyric id when selecting from the song list.
      if(this.selectedLyric?.id){
        this.router.navigate([`../${value}`], {
          relativeTo: this.activeRoute,
        });
      }
      else{
        //Switch to another lyrics
        this.router.navigate([`../lyrics/${value}`], {
          relativeTo: this.activeRoute,
        });
      }
    }
  }

  onBackToSong() {
    if(this.selectedLyric?.id){
    this.router.navigate(["../../.."], { relativeTo: this.activeRoute, queryParams: {songid: this.song?.id} });
    }
    else{
      this.router.navigate(["../.."], { relativeTo: this.activeRoute, queryParams: {songid: this.song?.id} });
    }
  }
}
