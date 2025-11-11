import {
  State,
  Selector,
  Action,
  StateContext,
} from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable, from, take, tap, switchMap } from 'rxjs';

import { Song, SongHelper } from '../model/song';
import { Account } from '../model/account';
import { SetlistSongService } from '../services/setlist-songs.service';
import { SongActions } from './song.actions';

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
    private setlistSongService: SetlistSongService
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
    const songForAdd = SongHelper.getForAdd(song, editingUser);

    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);

    const save$ = from(songsRef.add(songForAdd));

    return save$.pipe(
      switchMap((res) => {
        const rtnSong: Song = { id: res.id, ...songForAdd } as Song;
        const accountRef = this.db.doc(`/accounts/${accountId}`);

        return accountRef.valueChanges().pipe(
          take(1),
          switchMap((result) => {
            const account = result as Account;
            const nextCount = account?.countOfSongs ? account.countOfSongs + 1 : 1;
            return from(accountRef.update({ countOfSongs: nextCount })).pipe(map(() => rtnSong));
          })
        );
      }),
      tap((rtnSong) =>
        setState(
          patch({
            songs: append([rtnSong]),
          })
        )
      )
    );
  }

  @Action(SongActions.UpdateSong)
  updateSong(
    { setState }: StateContext<SongStateModel>,
    { accountId, songId, song, editingUser }: SongActions.UpdateSong
  ): Observable<void> {
    const songForUpdate = SongHelper.getForUpdate(song, editingUser);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);

    return from(songsRef.doc(songId).update(songForUpdate)).pipe(
      tap(() =>
        setState(
          patch({
            songs: updateItem<Song>((s) => s?.id === songId, {
              ...song,
              id: songId,
            }),
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

    const songForUpdate = SongHelper.getForUpdate(song, editingUser);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);

    return from(songsRef.doc(song.id!).update(songForUpdate)).pipe(
      switchMap(() =>
        this.setlistSongService.updateSetlistSongsBySongId(song.id!, song, editingUser)
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
