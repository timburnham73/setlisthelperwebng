import {
  State,
  Selector,
  Action,
  StateContext,
} from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Timestamp } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { map, Observable, from, take, tap, switchMap, forkJoin } from 'rxjs';

import { Song } from '../model/song';
import { SongFactory } from '../model/factory/song.factory';
import { Account } from '../model/account';
import { Artist } from '../model/artist';
import { Genre } from '../model/genre';
import { ArtistFactory } from '../model/factory/artist.factory';
import { GenreFactory } from '../model/factory/genre.factory';
import { SetlistSongService } from '../services/setlist-songs.service';
import { AccountService } from '../services/account.service';
import { ArtistService } from '../services/artist.service';
import { GenreService } from '../services/genre.service';
import { SongService } from '../services/song.service';
import { SongActions } from './song.actions';
import { ArtistActions } from './artist.actions';
import { GenreActions } from './genre.actions';
import { AccountActions } from './account.actions';
import { ArtistState } from './artist.state';
import { GenreState } from './genre.state';

export interface SongStateModel {
  songs: Song[];
  selectedSong: Song | null;
  loading: boolean;
  error: any;
}

@State<SongStateModel>({
  name: 'songs',
  defaults: {
    songs: [],
    selectedSong: null,
    loading: false,
    error: null,
  },
})
@Injectable()
export class SongState {
  constructor(
    private db: AngularFirestore,
    private setlistSongService: SetlistSongService,
    private store: Store,
    private accountService: AccountService,
    private artistService: ArtistService,
    private genreService: GenreService,
    private songService: SongService
  ) {}

  // Selectors
  @Selector()
  static all(state: SongStateModel): Song[] {
    return state.songs;
  }

  @Selector()
  static selected(state: SongStateModel): Song | null {
    return state.selectedSong;
  }

  @Selector()
  static loading(state: SongStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: SongStateModel): any {
    return state.error;
  }

  // Actions
  @Action(SongActions.LoadSongs)
  loadSongs(
    { setState }: StateContext<SongStateModel>,
    { accountId, sortField, sortOrder }: SongActions.LoadSongs
  ): Observable<Song[]> {
    setState(patch({ loading: true, error: null }));

    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection<Song>(dbPath, (ref) =>
      ref
        .orderBy('deactivated')
        .where('deactivated', '!=', true)
        .where('deleted', '==', false)
        .orderBy(sortField, sortOrder)
    );

    return songsRef.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => {
          const data = c.payload.doc.data();
          const id = c.payload.doc.id;
          return { id, ...data };
        })
      ),
      tap((songs) => setState(patch({ songs, loading: false })))
    );
  }

  @Action(SongActions.LoadSongsByTags)
  loadSongsByTags(
    { setState }: StateContext<SongStateModel>,
    { accountId, sortField, tagNames, sortOrder }: SongActions.LoadSongsByTags
  ): Observable<Song[]> {
    setState(patch({ loading: true, error: null }));

    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection<Song>(dbPath, (ref) =>
      ref
        .orderBy('deactivated')
        .where('deactivated', '!=', true)
        .where('deleted', '==', false)
        .where('tags', 'array-contains-any', tagNames)
        .orderBy(sortField, sortOrder)
    );

    return songsRef.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => {
          const data = c.payload.doc.data();
          const id = c.payload.doc.id;
          return { id, ...data };
        })
      ),
      tap((songs) => setState(patch({ songs, loading: false })))
    );
  }

  @Action(SongActions.GetSong)
  getSong(
    { setState }: StateContext<SongStateModel>,
    { accountId, songId }: SongActions.GetSong
  ): Observable<Song> {
    setState(patch({ loading: true, error: null }));

    const dbPath = `/accounts/${accountId}/songs`;
    const songRef = this.db.doc<Song>(`${dbPath}/${songId}`);

    return songRef.snapshotChanges().pipe(
      map((resultSong) => {
        const data = resultSong.payload.data();
        return { id: songId, ...data! } as Song;
      }),
      tap((song) => setState(patch({ selectedSong: song, loading: false })))
    );
  }

  @Action(SongActions.AddSong)
  addSong(
    { getState, setState }: StateContext<SongStateModel>,
    { accountId, song, editingUser }: SongActions.AddSong
  ): Observable<Song> {
    return this.songService.addSong(accountId, song, editingUser).pipe(
      tap((newSong: Song) =>
        setState(
          patch({
            songs: append([newSong]),
          })
        )
      )
    );
  }

  @Action(SongActions.UpdateSong)
  updateSong(
    { setState }: StateContext<SongStateModel>,
    { accountId, songId, song, editingUser }: SongActions.UpdateSong
  ): Observable<Song> {
    return this.songService.updateSong(accountId, songId, song, editingUser).pipe(
      switchMap((updatedSong: Song) =>
        (this.setlistSongService.updateSetlistSongsBySongId(
          accountId,
          songId,
          updatedSong,
          editingUser
        ) as Observable<any>).pipe(map(() => updatedSong))
      ),
      tap((updatedSong: Song) =>
        setState(
          patch({
            songs: updateItem<Song>((s) => !!s && s.id === songId, () => updatedSong),
          })
        )
      )
    );
  }

  @Action(SongActions.SetDefaultLyricForUser)
  setDefaultLyricForUser(
    { setState }: StateContext<SongStateModel>,
    { accountId, song, lyricId, editingUser }: SongActions.SetDefaultLyricForUser
  ): Observable<any> {
    const userLyric = song.defaultLyricForUser?.find((ul) => ul.uid === editingUser.uid);
    if (userLyric) {
      userLyric.lyricId = lyricId;
    } else {
      if (!song.defaultLyricForUser || song.defaultLyricForUser?.length === 0) {
        song.defaultLyricForUser = [{ uid: editingUser.uid, lyricId: lyricId }];
      } else {
        song.defaultLyricForUser.push({ uid: editingUser.uid, lyricId: lyricId });
      }
    }

    const songForUpdate = new SongFactory(editingUser).getForUpdate(song);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);

    return from(songsRef.doc(song.id!).update(songForUpdate)).pipe(
      switchMap(() =>
        this.setlistSongService.updateSetlistSongsBySongId(accountId, song.id!, song, editingUser)
      ),
      tap(() =>
        setState((state) => {
          const songs = state.songs.map((s) => (s.id === song.id ? song : s));
          const selectedSong = state.selectedSong && state.selectedSong.id === song.id ? song : state.selectedSong;
          return { ...state, songs, selectedSong };
        })
      )
    );
  }

  @Action(SongActions.RemoveSong)
  removeSong(
    { setState }: StateContext<SongStateModel>,
    { songToDelete, accountId }: SongActions.RemoveSong
  ): Observable<void> {
    const dbPath = `/accounts/${accountId}/songs`;
    const songsCollection = this.db.collection(dbPath);

    return from(songsCollection.doc(songToDelete.id!).delete()).pipe(
      tap(() => {
        const accountRef = this.db.doc(`/accounts/${accountId}`);
        accountRef
          .valueChanges()
          .pipe(take(1))
          .subscribe((result) => {
            const account = result as Account;
            accountRef.update({
              countOfSongs: account.countOfSongs ? account.countOfSongs - 1 : 1,
            });
          });
      }),
      tap(() =>
        setState((state) => {
          const songs = state.songs.filter((s) => s.id !== songToDelete.id);
          const selectedSong = state.selectedSong?.id === songToDelete.id ? null : state.selectedSong;
          return { ...state, songs, selectedSong };
        })
      )
    );
  }
}
