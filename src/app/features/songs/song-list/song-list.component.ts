import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource as MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { SAMPLE_SONGS } from 'src/app/core/model/sampleSongs';
import { BehaviorSubject, Observable, combineLatest, first, map } from 'rxjs';
import { Song } from 'src/app/core/model/song';
import { ActivatedRoute, Router } from '@angular/router';
import { SongEditDialogComponent } from '../song-edit-dialog/song-edit-dialog.component';
import { SongEdit } from 'src/app/core/model/account-song';
import { Store } from '@ngxs/store';
import { AccountActions } from 'src/app/core/store/account.actions';
import { AccountState } from 'src/app/core/store/account.state';
import { Account } from 'src/app/core/model/account';
import { getEntitlementLimits } from 'src/app/core/model/entitlement-limits';
import { SongActions } from 'src/app/core/store/song.actions';
import { SongState } from 'src/app/core/store/song.state';
import { getSongDetails as utilGetSongDetails, getSongLength as utilGetSongLength } from 'src/app/core/util/song.util';
import { LyricAddDialogComponent } from '../../lyrics/lyric-add-dialog/lyric-add-dialog.component';
import { AccountLyric, Lyric } from 'src/app/core/model/lyric';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import {
  MatDialog,
  MatDialogRef,
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';
import { CONFIRM_DIALOG_RESULT, ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { SetlistRef } from 'functions/src/model/setlist';
import { FlexLayoutModule, FlexModule } from 'ngx-flexible-layout';
import { MatSidenav } from '@angular/material/sidenav';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ExportColumn, ExportDialogComponent } from 'src/app/shared/export-dialog/export-dialog.component';

@Component({
    selector: 'app-song-list',
    templateUrl: './song-list.component.html',
    styleUrls: ['./song-list.component.scss'],
    standalone: true,
    imports: [
      MatCardModule, 
      MatToolbarModule, 
      MatButtonModule, 
      MatIconModule, 
      FormsModule, 
      MatFormFieldModule, 
      MatInputModule, 
      NgIf, 
      NgFor,
      AsyncPipe,
      MatProgressSpinnerModule, 
      MatTableModule, 
      MatSortModule,
      MatSidenav,
      FlexModule,
      FlexLayoutModule,
      MatPaginatorModule,
      MatMenuModule
    ]
})
export class SongListComponent implements OnInit {
  selectedAccount$: Observable<Account>;
  currentUser: any;
  displayedColumns: string[] = ['name', 'artist', 'genre', 'key', 'tempo', 'timeSignature', 'songLength', 'lyrics', 'setlists', 'remove'];
  songs$: Observable<Song[]>;
  loading$: Observable<boolean>;
  private searchTerm$ = new BehaviorSubject<string>('');
  filteredSongs$!: Observable<Song[]>;
  accountId: string;
  showRemove = false;
  showFind = false;
  @ViewChild(MatSort, { static: true }) sort: MatSort = new MatSort;

  private selectedAccount: Account;

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private store: Store,
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private router: Router,
    public dialog: MatDialog

  ) {
    this.selectedAccount$ = this.store.select(AccountState.selectedAccount);
    this.selectedAccount = this.store.selectSnapshot(AccountState.selectedAccount);
    this.songs$ = this.store.select(SongState.all);
    this.loading$ = this.store.select(SongState.loading);
    this.authService.user$.subscribe((user) => {
      if(user && user.uid){
        this.currentUser = user;
      }
    });
    
    const id = this.route.snapshot.paramMap.get('accountid');
    if(id){
      this.accountId = id;
      const songId = this.route.snapshot.queryParamMap.get('songid');
      // Dispatch load; do not subscribe here
      this.store.dispatch(new SongActions.LoadSongs(this.accountId, 'name', 'asc'));
      this.filteredSongs$ = combineLatest([this.songs$, this.searchTerm$]).pipe(
        map(([songs, term]) => {
          if(!songs) return [];
          if(!term) return songs;
          const t = term.toLowerCase();
          return songs.filter(s => s.name?.toLowerCase().includes(t));
        })
      );
      this.scrollSongtoView(songId);
    }
    
  }

  private scrollSongtoView(songId: string | null) {
    if (songId) {
      setTimeout(() => {
        const selectedRow = document.getElementById(songId);
        if (selectedRow) {
          selectedRow.scrollIntoView({ block: 'center' });
        }
      }, 400);
    }
  }

  ngOnInit() {
    this.titleService.setTitle('Songs');
  }

  search(search: string){
    this.searchTerm$.next(search || '');
  }

  sortChange(sortState: Sort) {
    const order = sortState.direction === 'asc' ? 'asc' : 'desc';
    this.store.dispatch(new SongActions.LoadSongs(this.accountId, sortState.active, order));
  }

  loadMore(){
    // For now, re-dispatch load (pagination not yet implemented in state)
    this.store.dispatch(new SongActions.LoadSongs(this.accountId, 'name', 'asc'));
  }

  onAddSong(){
    const account = this.store.selectSnapshot(AccountState.selectedAccount);
    const limits = getEntitlementLimits(account?.entitlementLevel);
    if (limits.maxSongs !== null && (account?.countOfSongs ?? 0) >= limits.maxSongs) {
      this.notificationService.openSnackBar(
        `Your plan allows up to ${limits.maxSongs} songs. Upgrade your subscription to add more.`
      );
      return;
    }

    const dialogRef = this.dialog.open(SongEditDialogComponent, {
      data: { accountId: this.accountId, song: null},
      panelClass: "dialog-responsive",
    });
  }

  onAddMultipleSongs(){
    this.router.navigate([`addmultiple`], { relativeTo: this.route });
  }

  onEditSong(row: any){
    const dialogRef = this.dialog.open(SongEditDialogComponent, {
      data: { accountId: this.accountId, song: row},
      panelClass: "dialog-responsive",
    })
    .afterClosed().subscribe((data) => {
    });
  }

  onShowFind(){
    this.showFind = !this.showFind;
  }

  onEnableDeleteMode() {
    this.showRemove = !this.showRemove;
  }

  onRemoveSong(event, songToDelete: Song) {
    event.preventDefault();
    if (this.currentUser?.uid !== this.selectedAccount?.ownerUser?.uid) {
      this.notificationService.openSnackBar(`Only the band owner, ${this.selectedAccount?.ownerUser?.displayName}, can delete this item.`);
      return;
    }
    const message = "Are you sure you want to delete this song?";

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: "Delete", message: message, message2: "", okButtonText: "Yes", cancelButtonText: "Cancel"},
      panelClass: "dialog-responsive",
      width: '300px',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',

    })
    .afterClosed().subscribe((data) => {
      if(data && data.result === CONFIRM_DIALOG_RESULT.OK){
        const updated = { ...songToDelete, deactivated: true } as Song;
        this.store.dispatch(new SongActions.UpdateSong(this.accountId!, updated.id!, updated, this.currentUser))
          .pipe(first())
          .subscribe();
      }
    });

  }

  onViewLyrics(event, row: any){
    event.preventDefault();
    this.router.navigate([row.id + `/lyrics`], { relativeTo: this.route });
  }

  onViewSetlists(event, row: any){
    event.preventDefault();
    this.router.navigate([`../setlists`], { relativeTo: this.route });
  }

  onAddLyric(event, row: Song){
    event.preventDefault();
    const accountLyric = { accountId: this.accountId, songId: row.id, createdByUserId: this.currentUser.uid };
    const dialogRef = this.dialog.open(LyricAddDialogComponent, {
      data: {accountLyric: accountLyric, countOfLyrics: 0},
      panelClass: "dialog-responsive",
    });

    dialogRef.afterClosed().subscribe((result: Lyric) => {
      if(result){
        this.router.navigate([row.id + `/lyrics/${result.id}/edit`], { relativeTo: this.route });
      }
    });
  }

  getSetlistCount(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.length;
    }
    return 0;
  }

  getSetlistNames(song){
    if(song && song.setlists && song.setlists.length > 0){
      return song.setlists.map((setlist: SetlistRef) => setlist.name).join(', ');
    }
    return 0;
  }

  // Expose utils for templates
  getSongLength(song: Song): string {
    return utilGetSongLength(song);
  }

  getSongDetails(song: Song): string {
    return utilGetSongDetails(song);
  }

  private getExportColumns(): ExportColumn[] {
    return [
      { key: 'name', label: 'Name', selected: true },
      { key: 'artist', label: 'Artist', selected: true },
      { key: 'genre', label: 'Genre', selected: true },
      { key: 'key', label: 'Key', selected: true },
      { key: 'tempo', label: 'Tempo', selected: true },
      { key: 'timeSignature', label: 'Time Signature', selected: false },
      { key: 'songLength', label: 'Song Length', selected: false },
      { key: 'notes', label: 'Notes', selected: false },
      { key: 'tags', label: 'Tags', selected: false },
    ];
  }

  onExport(format: 'csv' | 'html'): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      data: { columns: this.getExportColumns(), format },
      panelClass: 'dialog-responsive',
      width: '360px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.filteredSongs$.pipe(first()).subscribe(songs => {
        if (result.format === 'csv') {
          this.exportCsv(songs, result.columns);
        } else {
          this.exportHtml(songs, result.columns);
        }
      });
    });
  }

  private getSongFieldValue(song: Song, key: string): string {
    switch (key) {
      case 'name': return song.name || '';
      case 'artist': return song.artist || '';
      case 'genre': return song.genre || '';
      case 'key': return song.key || '';
      case 'tempo': return song.tempo ? String(song.tempo) : '';
      case 'timeSignature': return song.beatValue ? `${song.beatValue}/${song.noteValue}` : '';
      case 'songLength': return this.getSongLength(song);
      case 'notes': return song.notes || '';
      case 'tags': return song.tags?.join(', ') || '';
      default: return '';
    }
  }

  private exportCsv(songs: Song[], columns: ExportColumn[]): void {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows = songs.map(song =>
      columns.map(c => {
        const val = this.getSongFieldValue(song, c.key).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    this.downloadFile(csv, 'songs.csv', 'text/csv;charset=utf-8;');
  }

  private exportHtml(songs: Song[], columns: ExportColumn[]): void {
    const headerCells = columns.map(c => `<th>${c.label}</th>`).join('');
    const bodyRows = songs.map(song => {
      const cells = columns.map(c => {
        const val = this.getSongFieldValue(song, c.key)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<td>${val}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Songs Export</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background-color: #f5f5f5; font-weight: 600; }
  tr:nth-child(even) { background-color: #fafafa; }
  h1 { font-size: 1.4em; margin-bottom: 16px; }
</style></head><body>
<h1>Songs (${songs.length})</h1>
<table><thead><tr>${headerCells}</tr></thead><tbody>
${bodyRows}
</tbody></table></body></html>`;
    this.downloadFile(html, 'songs.html', 'text/html;charset=utf-8;');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
