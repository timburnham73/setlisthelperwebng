import {
  State,
  Selector,
  Action,
  StateContext,
} from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { map, Observable, from, take, tap, switchMap, forkJoin } from 'rxjs';

import { Song, SongHelper } from '../model/song';
import { Account } from '../model/account';
import { Artist } from '../model/artist';
import { Genre } from '../model/genre';
import { SetlistSongService } from '../services/setlist-songs.service';
import { AccountService } from '../services/account.service';
import { ArtistService } from '../services/artist.service';
import { GenreService } from '../services/genre.service';
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
    private genreService: GenreService
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
        
        // Fetch account, artist, and genre data in parallel
        const fetches: { [key: string]: Observable<any> } = {
          account: this.accountService.getAccount(accountId)
        };
        
        if (song.artist) {
          fetches.artist = this.artistService.getArtist(accountId, song.artist);
        }
        
        if (song.genre) {
          fetches.genre = this.genreService.getGenre(accountId, song.genre);
        }
        
        // Wait for all fetches to complete, then process updates in background
        return forkJoin(fetches).pipe(
          tap((results) => {
            // Update account song count if account exists
            const account = results.account as Account;
            if (account && account.id) {
              const accountRef = this.db.doc<Account>(`/accounts/${accountId}`);
              const nextCount = account.countOfSongs ? account.countOfSongs + 1 : 1;
              accountRef.update({ countOfSongs: nextCount });
            }
            
            // Handle artist: create or update count
            if (song.artist) {
              const existingArtist = results.artist as Artist | undefined;
              if (existingArtist && existingArtist.id) {
                const nextCount = (existingArtist.countOfSongs || 0) + 1;
                this.store.dispatch(new ArtistActions.UpdateArtist(accountId, existingArtist.id, existingArtist.name, nextCount, editingUser));
              } else {
                this.store.dispatch(new ArtistActions.AddArtist(accountId, song.artist, 1, editingUser));
              }
            }
            
            // Handle genre: create or update count
            if (song.genre) {
              const existingGenre = results.genre as Genre | undefined;
              if (existingGenre && existingGenre.id) {
                const nextCount = (existingGenre.countOfSongs || 0) + 1;
                this.store.dispatch(new GenreActions.UpdateGenre(accountId, existingGenre.id, existingGenre.name, nextCount, editingUser));
              } else {
                this.store.dispatch(new GenreActions.AddGenre(accountId, song.genre, 1, editingUser));
              }
            }
          }),
          map(() => rtnSong)
        );
      })
    );
  }

  @Action(SongActions.UpdateSong)
  updateSong(
    { setState }: StateContext<SongStateModel>,
    { accountId, songId, song, editingUser }: SongActions.UpdateSong
  ): Observable<void> {
    const songForUpdate = SongHelper.getForUpdate(song, editingUser);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection<Song>(dbPath);

    // Read previous song to detect artist/genre name changes
    const prev$ = songsRef.doc(songId).get().pipe(map((doc) => ({ id: songId, ...(doc.data() || {}) } as Song)));

    return prev$.pipe(
      switchMap((prevSong) =>
        from(songsRef.doc(songId).update(songForUpdate)).pipe(
          tap(() =>
            setState(
              patch({
                songs: updateItem<Song>((s) => !!s && (s as any).id === songId, (s) => ({ ...s!, ...song, id: songId })),
              })
            )
          ),
          switchMap(() => {
            // Build parallel fetches for counts and lookups
            const allSongsCount$ = this.db
              .collection<Song>(dbPath, (ref) => ref.where('deleted', '==', false))
              .get()
              .pipe(map((snap) => snap.size));

            const newArtistName = song.artist?.trim();
            const oldArtistName = prevSong.artist?.trim();
            const newGenreName = song.genre?.trim();
            const oldGenreName = prevSong.genre?.trim();

            const buildCount$ = (field: 'artistLowered' | 'genreLowered', name?: string) =>
              name
                ? this.db
                    .collection<Song>(dbPath, (ref) => ref.where(field, '==', name.toLowerCase()).where('deleted', '==', false))
                    .get()
                    .pipe(map((snap) => snap.size))
                : this.db.collection<Song>(dbPath).get().pipe(map(() => 0));

            const fetches: { [k: string]: Observable<any> } = {
              accountCount: allSongsCount$,
            };

            if (newArtistName) {
              fetches.newArtistCount = buildCount$('artistLowered', newArtistName);
              fetches.newArtistDoc = this.artistService.getArtist(accountId, newArtistName);
            }
            if (oldArtistName && oldArtistName.toLowerCase() !== (newArtistName || '').toLowerCase()) {
              fetches.oldArtistCount = buildCount$('artistLowered', oldArtistName);
              fetches.oldArtistDoc = this.artistService.getArtist(accountId, oldArtistName);
            }

            if (newGenreName) {
              fetches.newGenreCount = buildCount$('genreLowered', newGenreName);
              fetches.newGenreDoc = this.genreService.getGenre(accountId, newGenreName);
            }
            if (oldGenreName && oldGenreName.toLowerCase() !== (newGenreName || '').toLowerCase()) {
              fetches.oldGenreCount = buildCount$('genreLowered', oldGenreName);
              fetches.oldGenreDoc = this.genreService.getGenre(accountId, oldGenreName);
            }

            return forkJoin(fetches).pipe(
              tap((results) => {
                // Update account songs count
                const total = results.accountCount as number;
                const accountRef = this.db.doc<Account>(`/accounts/${accountId}`);
                accountRef.update({ countOfSongs: total });

                // Update/add new artist
                if (newArtistName) {
                  const newCount = results.newArtistCount as number;
                  const doc = results.newArtistDoc as Artist | undefined;
                  if (doc && doc.id) {
                    this.store.dispatch(
                      new ArtistActions.UpdateArtist(accountId, doc.id, doc.name, newCount, editingUser)
                    );
                  } else {
                    this.store.dispatch(new ArtistActions.AddArtist(accountId, newArtistName, newCount, editingUser));
                  }
                }

                // Update old artist if name changed
                if (oldArtistName && oldArtistName.toLowerCase() !== (newArtistName || '').toLowerCase()) {
                  const oldCount = results.oldArtistCount as number;
                  const oldDoc = results.oldArtistDoc as Artist | undefined;
                  if (oldDoc && oldDoc.id) {
                    this.store.dispatch(
                      new ArtistActions.UpdateArtist(accountId, oldDoc.id, oldDoc.name, oldCount, editingUser)
                    );
                  } else if (oldArtistName) {
                    // If old artist doc missing but songs exist, ensure doc exists
                    if (oldCount > 0) {
                      this.store.dispatch(new ArtistActions.AddArtist(accountId, oldArtistName, oldCount, editingUser));
                    }
                  }
                }

                // Update/add new genre
                if (newGenreName) {
                  const newGCount = results.newGenreCount as number;
                  const gdoc = results.newGenreDoc as Genre | undefined;
                  if (gdoc && gdoc.id) {
                    this.store.dispatch(
                      new GenreActions.UpdateGenre(accountId, gdoc.id, gdoc.name, newGCount, editingUser)
                    );
                  } else {
                    this.store.dispatch(new GenreActions.AddGenre(accountId, newGenreName, newGCount, editingUser));
                  }
                }

                // Update old genre if name changed
                if (oldGenreName && oldGenreName.toLowerCase() !== (newGenreName || '').toLowerCase()) {
                  const oldGCount = results.oldGenreCount as number;
                  const oldGDoc = results.oldGenreDoc as Genre | undefined;
                  if (oldGDoc && oldGDoc.id) {
                    this.store.dispatch(
                      new GenreActions.UpdateGenre(accountId, oldGDoc.id, oldGDoc.name, oldGCount, editingUser)
                    );
                  } else if (oldGenreName) {
                    if (oldGCount > 0) {
                      this.store.dispatch(new GenreActions.AddGenre(accountId, oldGenreName, oldGCount, editingUser));
                    }
                  }
                }
              }),
              map(() => void 0)
            );
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
