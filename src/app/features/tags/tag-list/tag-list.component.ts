import { DragDropModule } from '@angular/cdk/drag-drop';
import { DatePipe, NgIf, NgClass, NgFor } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
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
import { NGXLogger } from 'ngx-logger';
import { finalize, Observable } from 'rxjs';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SetlistSongService } from 'src/app/core/services/setlist-songs.service';
import { SetlistService } from 'src/app/core/services/setlist.service';
import { SongService } from 'src/app/core/services/song.service';
import { AccountState } from 'src/app/core/store/account.state';
import { Account } from 'functions/src/model/account';
import { Song } from 'src/app/core/model/song';
import { MatSpinner } from '@angular/material/progress-spinner';

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
    MatSpinner
  ],
  templateUrl: './tag-list.component.html',
  styleUrl: './tag-list.component.scss'
})
export class TagListComponent {
  @Select(AccountState.selectedAccount)
  selectedAccount$!: Observable<Account>;
  currentUser: BaseUser;
  displayedColumns: string[] = [
    "sequence",
    "name",
    "artist",
    "genre",
    "key",
    "tempo",
    "timeSignature",
    "songLength",
    "lyrics",
    "remove"
  ];
  
  filteredSongs: Song[];
  allSongs: Song[];
  songsLoading: Boolean = false;
  @ViewChild(MatSort, { static: true }) sort: MatSort = new MatSort;
  accountId?: string;
  
  constructor(
    private activeRoute: ActivatedRoute,
    private logger: NGXLogger,
    private route: ActivatedRoute,
    private titleService: Title,
    private setlistSongsService: SetlistSongService,
    private setlistService: SetlistService,
    public songService: SongService,
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
    const setlistId = this.route.snapshot.paramMap.get("setlistid");
    if (accountId && setlistId) {
      this.accountId = accountId;

      //Get the songs for the song picker
      this.songService.getSongs(this.accountId, "name").subscribe((songs) => {
        this.allSongs = this.filteredSongs = songs;
      });

      //Get the setlist songs
      if (setlistId) {
        this.setlistService
          .getSetlist(this.accountId, setlistId)
          .subscribe((setlist) => this.setlist = setlist);

        this.setlistSongsService
          .getOrderedSetlistSongs(this.accountId, setlistId)
          .subscribe((setlistSongs) => {
            this.dsSetlistSongs = new MatTableDataSource(setlistSongs);
            this.setlistSongCount = this.dsSetlistSongs.filteredData.length;
          });
      }
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

  search(search: string){
    this.filteredSongs = this.allSongs.filter((song) => song.name.toLowerCase().includes(search));
  }
}
