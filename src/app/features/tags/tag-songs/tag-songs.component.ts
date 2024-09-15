import { DatePipe, CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectionList, MatListOption } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule, FlexModule } from 'ngx-flexible-layout';
import { ExpandIconComponent } from 'src/app/shared/icons/expand-icon/expand-icon.component';
import { SongSelectorComponent } from '../../setlists/song-selector/song-selector.component';
import { SongEditDialogComponent } from '../../songs/song-edit-dialog/song-edit-dialog.component';
import { concatMap, finalize, Observable, Subscription, switchMap, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SongService } from 'src/app/core/services/song.service';
import { TagService } from 'src/app/core/services/tag.service';
import { AccountState } from 'src/app/core/store/account.state';
import { BaseUser, UserHelper } from 'src/app/core/model/user';
import { Account } from 'src/app/core/model/account';
import { Song } from 'src/app/core/model/song';
import { Tag } from 'src/app/core/model/tag';
import { Setlist } from 'src/app/core/model/setlist';

@Component({
  selector: 'app-tag-songs',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatToolbarModule,
    MatDivider,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
    CommonModule,
    SongEditDialogComponent,
    SongSelectorComponent,
    FlexModule,
    ExpandIconComponent,
    MatSpinner,
    MatSelectionList,
    MatListOption
  ],
  templateUrl: './tag-songs.component.html',
  styleUrl: './tag-songs.component.scss'
})
export class TagSongsComponent {
  selectedAccount$!: Observable<Account>;
  currentUser: BaseUser;
  displayedColumns: string[] = [ 'name', 'artist', 'genre', 'key', 'tempo', 'timeSignature', 'songLength', 'lyrics', 'setlists', 'remove'];
  showRemove = false;
  showFind = false;
  subscription: Subscription;
  filteredSongs: Song[];
  allSongs: Song[];
  selectedTag: Tag;
  songsLoading: Boolean = false;
  @ViewChild(MatSort, { static: true }) sort: MatSort = new MatSort;
  accountId?: string;
  tagId?: string;

  constructor(
    private activeRoute: ActivatedRoute,
    private route: ActivatedRoute,
    private titleService: Title,
    public songService: SongService,
    public tagService: TagService,
    private store: Store,
    private authService: AuthenticationService,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.titleService.setTitle('Song Tags');
    this.authService.user$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = UserHelper.getForUpdate(user);
      }
    });

    const selectedAccount = this.store.selectSnapshot(
      AccountState.selectedAccount
    );

    const accountId = this.route.snapshot.paramMap.get("accountid");
    const tagId = this.route.snapshot.paramMap.get("tagid");
    if (accountId && tagId) {
      this.accountId = accountId;
      this.tagId = tagId;
    }
  }

  ngOnInit(): void {
    if (this.accountId && this.tagId) {
      //Initiallize the tags and close the subscription with take(1)
      this.tagService.getTag(this.accountId!, this.tagId)
        .pipe(
          take(1),
          switchMap((result: Tag) => {
            this.selectedTag = result;
            return this.songService.getSongsByTags(this.accountId!, 'name', [result.name])
          })
        )
        .subscribe((songs) => {
          this.allSongs = this.filteredSongs = songs;
        });
    }
  }

  search(search: string){
    this.filteredSongs = this.allSongs.filter((song) => song.name.toLowerCase().includes(search));
  }

  onEnableDeleteMode() {
    this.showRemove = !this.showRemove;
  }

  onViewLyrics(event, row: any){
    event.preventDefault();
    this.router.navigate([row.id + `/lyrics`], { relativeTo: this.route });
  }

  sortChange(sortState: Sort) {
    this.songService.getSongs(this.accountId!, sortState.active, sortState.direction === "asc" ? "asc" : "desc")
        .pipe(
          finalize(() => this.songsLoading = false)
        )
        .subscribe((songs) => {
          this.allSongs = this.filteredSongs = songs;
        });
  }

  onBackButtonPressed() {
    this.router.navigate(["../.."], { relativeTo: this.activeRoute });
  }

  onAddFromCatalog() {
    if( this.accountId){
      const dialogRef = this.dialog.open(SongSelectorComponent, {
        data: { accountId: this.accountId, setlistId: null, setlistsongIdToinsertAfter: 0 },
        panelClass: "dialog-responsive",
      });

      dialogRef.afterClosed().subscribe((songs) => {
        
        this.tagService.addTagsToSongs(songs, this.accountId!, [this.selectedTag.name], this.currentUser).subscribe((songs) => {
          
        });
        
      }); 
    }
  }

  onShowFind(){
    this.showFind = !this.showFind;
  }

  onEditSong(song){
    const dialogRef = this.dialog.open(SongEditDialogComponent, {
      data: { accountId: this.accountId, song: song},
      panelClass: "dialog-responsive",
    })
    .afterClosed().subscribe((data) => {
    });
  }

  getSetlistNames(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.map((setlist: Setlist) => setlist.name).join(', ');
    }
    return 0;
  }

  getSetlistCount(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.length;
    }
    return 0;
  }

  onViewSetlists(event, row: any){
    event.preventDefault();
    this.router.navigate([`setlists`], { relativeTo: this.route });
  }

  onRemoveTagFromSong($event, song){
    $event.preventDefault();
    this.tagService.removeTagsToSongs([song], this.accountId!, [this.selectedTag.name], this.currentUser).subscribe((songs) => {
      
    });
  }
}
