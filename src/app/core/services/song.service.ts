import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap, take, forkJoin } from "rxjs";
import { QuerySnapshot, Timestamp } from "@angular/fire/firestore";
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Song } from '../model/song';
import { SongFactory } from '../model/factory/song.factory';
import { BaseUser } from '../model/user';
import { CollectionReference, OrderByDirection } from 'firebase/firestore';
import { SetlistSongService } from './setlist-songs.service';
import {Query } from '@angular/fire/firestore';
import { Account } from '../model/account';
import { ArtistFactory } from '../model/factory/artist.factory';
import { GenreFactory } from '../model/factory/genre.factory';
import { Artist } from '../model/artist';
import { Genre } from '../model/genre';
import { ArtistService } from './artist.service';
import { GenreService } from './genre.service';

@Injectable({
  providedIn: 'root'
})
export class SongService {

  constructor(private db: AngularFirestore,
              private setlistSongService: SetlistSongService,
              private artistService: ArtistService,
              private genreService: GenreService) {
    
  }

  getSong(accountId: string, songId: string): Observable<any> {
    const dbPath = `/accounts/${accountId}/songs`;
    const songRef = this.db.collection(dbPath).doc(songId);
    return songRef.snapshotChanges().pipe(
      map((resultSong) =>
          {
            const song = resultSong.payload.data() as Song;
            song.id = songId;
            return song;
          }
      )
    );
  }

  
  getSongsByTags(accountId: string, sortField: string, tagNames: string[], sortOrder: OrderByDirection = 'asc'): Observable<Song[]> {
    const dbPath = `/accounts/${accountId}/songs`;
    
    const songsRef = this.db.collection(dbPath, ref => ref.orderBy("deactivated").where("deactivated", "!=", true).where("deleted", "==", false).where("tags", "array-contains-any", tagNames).orderBy(sortField, sortOrder));
    
    return songsRef.snapshotChanges().pipe(
      map((changes) =>
      changes.map((c) => {
        const song = c.payload.doc.data() as Song;
        song.id = c.payload.doc.id;
        return song;
      })
    )
    );
  }

  getSongs(accountId: string, sortField: string, sortOrder: OrderByDirection = 'asc'): Observable<Song[]> {
    const dbPath = `/accounts/${accountId}/songs`;
    
    const songsRef = this.db.collection(dbPath, ref => ref.orderBy("deactivated").where("deactivated", "!=", true).where("deleted", "==", false).orderBy(sortField, sortOrder));
    
    return songsRef.snapshotChanges().pipe(
      map((changes) =>
      changes.map((c) => {
        const song = c.payload.doc.data() as Song;
        song.id = c.payload.doc.id;
        return song;
      })
    )
    );
  }

  buildCollectionReference(ref: CollectionReference){
    return ref;
  }

  addSong(accountId: string, song: Song, editingUser: BaseUser): Observable<Song> {
    const songForAdd = new SongFactory(editingUser).getForAdd(song);
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
          if (existingArtist && (existingArtist as any).id) {
            const aRef = this.db.firestore.doc(`${artistsPath}/${(existingArtist as any).id}`);
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
          if (existingGenre && (existingGenre as any).id) {
            const gRef = this.db.firestore.doc(`${genresPath}/${(existingGenre as any).id}`);
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

  updateSong(accountId: string, songId: string, song: Song, editingUser: BaseUser): Observable<Song> {
    const dbPath = `/accounts/${accountId}/songs`;
    const songForUpdate = new SongFactory(editingUser).getForUpdate(song);

    const runTx = () =>
      this.db.firestore.runTransaction(async (tx) => {
        const songDocRef = this.db.firestore.doc(`${dbPath}/${songId}`);

        // Read previous song
        const prevSnap = await tx.get(songDocRef);
        const prevData = prevSnap.data() ?? {};

        // Update the song first
        tx.update(songDocRef, songForUpdate);

        const anyPrev: any = prevData;
        const oldArtist = typeof anyPrev.artist === 'string' ? anyPrev.artist.trim() : undefined;
        const newArtist = song.artist?.trim();
        const oldGenre = typeof anyPrev.genre === 'string' ? anyPrev.genre.trim() : undefined;
        const newGenre = song.genre?.trim();

        return { oldArtist, newArtist, oldGenre, newGenre };
      });

    return from(runTx()).pipe(
      switchMap(({ oldArtist, newArtist, oldGenre, newGenre }) => {
        const artistNames = new Set<string>();
        if (newArtist) artistNames.add(newArtist);
        if (!newArtist && oldArtist) artistNames.add(oldArtist);
        if (oldArtist && newArtist && oldArtist.toLowerCase() !== newArtist.toLowerCase()) {
          artistNames.add(oldArtist);
        }

        const genreNames = new Set<string>();
        if (newGenre) genreNames.add(newGenre);
        if (!newGenre && oldGenre) genreNames.add(oldGenre);
        if (oldGenre && newGenre && oldGenre.toLowerCase() !== newGenre.toLowerCase()) {
          genreNames.add(oldGenre);
        }

        return this.recomputeArtistAndGenreCounts(accountId, artistNames, genreNames, editingUser);
      }),
      switchMap(() =>
        this.setlistSongService.updateSetlistSongsFromSong(accountId, { ...song, id: songId } as Song, editingUser)
      ),
      map(() => ({ ...song, id: songId } as Song))
    );
  }

  removeSong(
    songToDelete: Song,
    accountId: string,
    editingUser: BaseUser
  ): any {
    const dbPath = `/accounts/${accountId}/songs`;
    const songsCollection = this.db.collection(dbPath);
    return from(songsCollection.doc(songToDelete.id).delete()).pipe(
      switchMap(() => {
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

        const artistNames = new Set<string>();
        if (songToDelete.artist) {
          artistNames.add(songToDelete.artist.trim());
        }

        const genreNames = new Set<string>();
        if (songToDelete.genre) {
          genreNames.add(songToDelete.genre.trim());
        }

        return this.recomputeArtistAndGenreCounts(accountId, artistNames, genreNames, editingUser);
      })
    );
  }

  private recomputeArtistAndGenreCounts(
    accountId: string,
    artistNames: Set<string>,
    genreNames: Set<string>,
    editingUser: BaseUser
  ): Observable<any> {
    const dbPath = `/accounts/${accountId}/songs`;
    const artistsPath = `/accounts/${accountId}/artists`;
    const genresPath = `/accounts/${accountId}/genres`;
    const songsColl = this.db.firestore.collection(dbPath);

    const recompute = async (
      name: string,
      songField: 'artist' | 'genre',
      targetCollPath: string,
      makeDocForAdd: (name: string, count: number) => any
    ) => {
      const countSnap = await songsColl
        .where(songField, '==', name)
        .where('deleted', '==', false)
        .get();
      const count = countSnap.size;

      const qSnap = await this.db.firestore
        .collection(targetCollPath)
        .where('nameLowered', '==', name.toLowerCase())
        .limit(1)
        .get();
      if (!qSnap.empty) {
        await qSnap.docs[0].ref.set({ countOfSongs: count }, { merge: true });
      } else if (count > 0) {
        const doc = makeDocForAdd(name, count);
        await this.db.firestore.collection(targetCollPath).add(doc);
      }
    };

    const recomputeArtist = (name: string) =>
      recompute(
        name,
        'artist',
        artistsPath,
        (n, c) => new ArtistFactory(editingUser).getForAdd({ name: n, countOfSongs: c })
      );

    const recomputeGenre = (name: string) =>
      recompute(
        name,
        'genre',
        genresPath,
        (n, c) => new GenreFactory(editingUser).getForAdd({ name: n, countOfSongs: c })
      );

    const promises: Promise<any>[] = [];
    artistNames.forEach((n) => promises.push(recomputeArtist(n)));
    genreNames.forEach((n) => promises.push(recomputeGenre(n)));

    return from(Promise.all(promises));
  }

  setDefaultLyricForUser(accountId: string, song: Song, lyricId: string, editingUser: BaseUser): Observable<any> {
    const userLyric = song.defaultLyricForUser?.find((userLyric) => userLyric.uid === editingUser.uid);
    if(userLyric){
      userLyric.lyricId = lyricId;
    }
    else{
      if(!song.defaultLyricForUser || song.defaultLyricForUser?.length === 0) {
        song.defaultLyricForUser = [{uid: editingUser.uid, lyricId: lyricId}]; 
      }
      else{
        song.defaultLyricForUser.push({uid: editingUser.uid, lyricId: lyricId});
      }
    }
    const songForUpdate = new SongFactory(editingUser).getForUpdate(song);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);
    
    return from(songsRef.doc(song.id).update(songForUpdate)).pipe(
      switchMap(() => {
        return this.setlistSongService.updateSetlistSongsBySongId(accountId, song.id!, song, editingUser);
      }
    ));
  }
  getSongDetails(song){
    const songDetails: string[] = [];

    if(song.isBreak){
      if(song.notes){
        songDetails.push(song.notes)
      }
    }
    else{
      if(song.artist){
        songDetails.push(song.artist)
      }
      if(song.genre){
        songDetails.push(song.genre)
      }
      if(song.key){
        songDetails.push(song.key)
      }
      if(song.tempo){
        songDetails.push(song.tempo)
      }
    }
    
    if(song.songLength){
      songDetails.push(this.getSongLength(song))
    }
    
    return songDetails.join(' - ');
  }

  getSongLength(song){
    return song.lengthMin ? song.lengthMin + ':' + song.lengthSec?.toString().padStart(2, '0') : '';
  }
}
