import { DragDropModule } from '@angular/cdk/drag-drop';
import { DatePipe, NgIf, NgClass, NgFor } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FlexLayoutModule, FlexModule } from 'ngx-flexible-layout';
import { ExpandIconComponent } from 'src/app/shared/icons/expand-icon/expand-icon.component';
import { SongSelectorComponent } from '../../setlists/song-selector/song-selector.component';
import { SongEditDialogComponent } from '../../songs/song-edit-dialog/song-edit-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { BaseUser, UserHelper } from 'functions/src/model/user';
import { finalize, first, Observable, Subscription, take } from 'rxjs';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SongService } from 'src/app/core/services/song.service';
import { AccountState } from 'src/app/core/store/account.state';
import { Account } from 'functions/src/model/account';
import { Song } from 'src/app/core/model/song';
import { MatSpinner } from '@angular/material/progress-spinner';
import { TagService } from 'src/app/core/services/tag.service';
import { Tag } from 'src/app/core/model/tag';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { TagEditDialogComponent } from '../tag-edit-dialog/tag-edit-dialog.component';
import { CONFIRM_DIALOG_RESULT, ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { user } from '@angular/fire/auth';
import { Setlist } from 'src/app/core/model/setlist';

@Component({
  selector: 'app-tag-list',
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
    NgIf,
    NgClass,
    NgFor,
    DragDropModule,
    SongEditDialogComponent,
    SongSelectorComponent,
    FlexModule,
    ExpandIconComponent,
    MatSpinner,
    MatSelectionList,
    MatListOption

  ],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.scss'
})
export class TagListComponent implements OnInit {
  @Select(AccountState.selectedAccount)
  
  selectedAccount$!: Observable<Account>;
  currentUser: BaseUser;
  displayedSongColumns: string[] = ["name", "more"];
  displayedColumns: string[] = [ 'name', 'artist', 'genre', 'key', 'tempo', 'timeSignature', 'songLength', 'lyrics', 'setlists', 'remove'];
  selectedTags: Tag[] = [];
  showRemove = false;
  subscription: Subscription;
  filteredSongs: Song[];
  allSongs: Song[];
  allTags: Tag[];
  selectedTag: Tag;
  songsLoading: Boolean = false;
  @ViewChild(MatSort, { static: true }) sort: MatSort = new MatSort;
  accountId?: string;
  
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
    if (accountId) {
      this.accountId = accountId;
    }
  }
  
  ngOnInit(): void {
    if (this.accountId) {
      //Initiallize the tags and close the subscription with take(1)
      this.tagService.getTags(this.accountId!, 'name')
        .pipe(
          take(1),
          finalize(() => {
            this.songsLoading = false;
            if(this.allTags && this.allTags.length > 0){
              this.onSelectTag(null, this.allTags[0]);
            }
          })
        )
        .subscribe((tags) => {
          this.allTags = tags;
        });

        //Keep the subscription open for new tags
        this.tagService.getTags(this.accountId!, 'name')
          .subscribe((tags) => {
            this.allTags = tags;
          });
    }
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

  getSetlistNames(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.map((setlist: Setlist) => setlist.name).join(', ');
    }
    return 0;
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

  onViewSetlists(event, row: any){
    event.preventDefault();
    this.router.navigate([`setlists`], { relativeTo: this.route });
  }

  getSetlistCount(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.length;
    }
    return 0;
  }

  onSelectTag($event, selectedTag: Tag){
    $event?.preventDefault();
    if($event?.target.innerText === "more_vert"){
      return;
    }
    const tagIndex = this.selectedTags.findIndex(tag => tag.name === selectedTag.name);
    if(tagIndex > -1) {
      this.selectedTags.splice(tagIndex, 1);
    }
    else{
      this.selectedTags.push(selectedTag);
    }
    if(this.accountId){
      const tags = this.selectedTags.map(tag => tag.name);
      if (tags && tags.length > 0) {
        if(this.subscription){
          this.subscription.unsubscribe();
        }
        this.subscription = this.songService.getSongsByTags(this.accountId, "name", tags)
                                .subscribe((songs) => {
            this.allSongs = this.filteredSongs = songs;
        });
      }
      else {
        this.allSongs = this.filteredSongs = [];
      }
    }
  }

  onAddTag(){
    const dialogRef = this.dialog.open(TagEditDialogComponent, {
      data: {accountId: this.accountId, tag: null},
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((data) => {
      
    }); 
  }

  onDeleteTag(tagToDelete){
    let message = "Are you sure you want to delete this Tag?";
    let message2 = "";
    
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: "Delete", message: message, message2, okButtonText: "Yes", cancelButtonText: "Cancel"},
      panelClass: "dialog-responsive",
      width: '300px',
      enterAnimationDuration: '200ms', 
      exitAnimationDuration: '200ms',
      
    })
    .afterClosed().subscribe((data) => {
      if(data && data.result === CONFIRM_DIALOG_RESULT.OK){
        
          this.tagService
              .removeTag(tagToDelete, this.accountId!, this.currentUser)
              .pipe(first())
              .subscribe(); 
      }
    }); 
  }

  onEditTag(tag){
    const dialogRef = this.dialog.open(TagEditDialogComponent, {
      data: {accountId: this.accountId, tag: tag},
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((data) => {
      
    }); 
  }

  onAddFromCatalog() {
    
    if( this.accountId){
      const dialogRef = this.dialog.open(SongSelectorComponent, {
        data: { accountId: this.accountId, setlistId: null, setlistsongIdToinsertAfter: 0 },
        panelClass: "dialog-responsive",
      });

      dialogRef.afterClosed().subscribe((songs) => {
        
        this.tagService.addTagsToSongs(songs, this.accountId!, this.selectedTags.map(tag => tag.name), this.currentUser).subscribe((songs) => {
          
        });
        
      }); 

    }
  }

  onEditSong(song){
    const dialogRef = this.dialog.open(SongEditDialogComponent, {
      data: { accountId: this.accountId, song: song},
      panelClass: "dialog-responsive",
    })
    .afterClosed().subscribe((data) => {
    });
  }

  onViewTag(tag){
    this.router.navigate([tag.id + '/songs'], { relativeTo: this.route } );
  }

  onRemoveTagFromSong($event, song){
    $event.preventDefault();
    this.tagService.removeTagsToSongs([song], this.accountId!, this.selectedTags.map(tag => tag.name), this.currentUser).subscribe((songs) => {
      console.log('Removed song');
    });
  }

  isRowSelected(row) {
    const selectedRowIndex = this.selectedTags?.findIndex(tag => tag.name === row.name);
    return selectedRowIndex > -1; 
  }
}
