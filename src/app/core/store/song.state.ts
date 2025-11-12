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

import { Song, SongHelper } from '../model/song';
import { Account } from '../model/account';
import { Artist } from '../model/artist';
import { Genre } from '../model/genre';
import { ArtistFactory } from '../model/factory/artist.factory';
import { GenreFactory } from '../model/factory/genre.factory';
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
    const artistsPath = `/accounts/${accountId}/artists`;
    const genresPath = `/accounts/${accountId}/genres`;

    // Pre-read artist/genre to determine existing docs
    const artist$ = song.artist ? this.artistService.getArtist(accountId, song.artist) : from([undefined]);
    const genre$ = song.genre ? this.genreService.getGenre(accountId, song.genre) : from([undefined]);

    return forkJoin({ artist: artist$, genre: genre$ }).pipe(
      switchMap(({ artist: existingArtist, genre: existingGenre }) => {
        const batch = this.db.firestore.batch();

        // Create song doc with generated id in batch
        const songDocRef = this.db.firestore.collection(dbPath).doc();
        const rtnSong: Song = { id: songDocRef.id, ...songForAdd };
        batch.set(songDocRef, songForAdd);

        // Account count increment
        const accountRef = this.db.firestore.doc(`/accounts/${accountId}`);
        batch.set(accountRef, { countOfSongs: firebase.firestore.FieldValue.increment(1) }, { merge: true });

        // Artist upsert/increment
        if (song.artist) {
          if (existingArtist && existingArtist.id) {
            const aRef = this.db.firestore.doc(`${artistsPath}/${existingArtist.id}`);
            batch.set(
              aRef,
              { countOfSongs: firebase.firestore.FieldValue.increment(1) },
              { merge: true }
            );
          } else {
            const factory = new ArtistFactory(editingUser);
            const artistForAdd = factory.getForAdd({ name: song.artist, countOfSongs: 1 });
            const aRef = this.db.firestore.collection(artistsPath).doc();
            batch.set(aRef, artistForAdd);
          }
        }

        // Genre upsert/increment
        if (song.genre) {
          if (existingGenre && existingGenre.id) {
            const gRef = this.db.firestore.doc(`${genresPath}/${existingGenre.id}`);
            batch.set(gRef, { countOfSongs: firebase.firestore.FieldValue.increment(1) }, { merge: true });
          } else {
            const factory = new GenreFactory(editingUser);
            const genreForAdd = factory.getForAdd({ name: song.genre, countOfSongs: 1 });
            const gRef = this.db.firestore.collection(genresPath).doc();
            batch.set(gRef, genreForAdd);
          }
        }

        return from(batch.commit()).pipe(map(() => rtnSong));
      })
    );
  }

  @Action(SongActions.UpdateSong)
  updateSong(
    { setState }: StateContext<SongStateModel>,
    { accountId, songId, song, editingUser }: SongActions.UpdateSong
  ): Observable<void> {
    const dbPath = `/accounts/${accountId}/songs`;
    const artistsPath = `/accounts/${accountId}/artists`;
    const genresPath = `/accounts/${accountId}/genres`;
    const songForUpdate = SongHelper.getForUpdate(song, editingUser);

    const runTx = () =>
      this.db.firestore.runTransaction(async (tx) => {
        const songDocRef = this.db.firestore.doc(`${dbPath}/${songId}`);
        const accountRef = this.db.firestore.doc(`/accounts/${accountId}`);

        // Read previous song
        const prevSnap = await tx.get(songDocRef);
        const prevData = prevSnap.data() ?? {};

        // Update the song first
        tx.update(songDocRef, songForUpdate);

        // Account: typically unchanged on update; keep consistent by not altering unless you want to recompute elsewhere
        // If you need to ensure account count correctness via increments only on add/remove, skip here

        const anyPrev: any = prevData;
        const oldArtist = typeof anyPrev.artist === 'string' ? anyPrev.artist.trim() : undefined;
        const newArtist = song.artist?.trim();
        const oldGenre = typeof anyPrev.genre === 'string' ? anyPrev.genre.trim() : undefined;
        const newGenre = song.genre?.trim();

        // Helper to upsert and increment a named doc in a collection
        const upsertIncrement = async (
          collPath: string,
          name: string,
          factory: 'artist' | 'genre',
          delta: number
        ) => {
          // Find by nameLowered
          const qSnap = await this.db.firestore
            .collection(collPath)
            .where('nameLowered', '==', name.toLowerCase())
            .limit(1)
            .get();
          if (!qSnap.empty) {
            const docRef = qSnap.docs[0].ref;
            tx.set(docRef, { countOfSongs: firebase.firestore.FieldValue.increment(delta) }, { merge: true });
          } else if (delta > 0) {
            const docRef = this.db.firestore.collection(collPath).doc();
            if (factory === 'artist') {
              const a = new ArtistFactory(editingUser).getForAdd({ name, countOfSongs: delta });
              tx.set(docRef, a);
            } else {
              const g = new GenreFactory(editingUser).getForAdd({ name, countOfSongs: delta });
              tx.set(docRef, g);
            }
          }
        };

        // Adjust artist counts if changed
        if (oldArtist && oldArtist.toLowerCase() !== (newArtist || '').toLowerCase()) {
          await upsertIncrement(artistsPath, oldArtist, 'artist', -1);
        }
        if (newArtist) {
          await upsertIncrement(artistsPath, newArtist, 'artist', 1);
        }

        // Adjust genre counts if changed
        if (oldGenre && oldGenre.toLowerCase() !== (newGenre || '').toLowerCase()) {
          await upsertIncrement(genresPath, oldGenre, 'genre', -1);
        }
        if (newGenre) {
          await upsertIncrement(genresPath, newGenre, 'genre', 1);
        }
      });

    return from(runTx()).pipe(
      tap(() =>
        setState(
          patch({
            songs: updateItem<Song>((s) => !!s && s.id === songId, (s) => ({ ...s!, ...song, id: songId })),
          })
        )
      ),
      map(() => void 0)
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
