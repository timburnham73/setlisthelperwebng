import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap, take } from "rxjs";
import { QuerySnapshot, Timestamp } from "@angular/fire/firestore";
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
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

@Injectable({
  providedIn: 'root'
})
export class SongService {

  constructor(private db: AngularFirestore,
              private setlistSongService: SetlistSongService) {
    
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
    const songsRef = this.db.collection(dbPath);
    
    let save$: Observable<any>;
    save$ = from(songsRef.add(songForAdd));
    const batch = this.db.firestore.batch();

    const artistsRef = this.db.collection<Artist>(`/accounts/${accountId}/artists`);
    const genresRef = this.db.collection<Genre>(`/accounts/${accountId}/genres`);

    return save$.pipe(
      map((res) => {
        const rtnSong = {
          id: res.id,
          ...songForAdd,
        };

        const accountRef = this.db.doc(`/accounts/${accountId}`);
        accountRef
        .valueChanges()
          .pipe(take(1))
          .subscribe((result) => {
            const account = result as Account;
            accountRef.update({
              countOfSongs: account.countOfSongs ? account.countOfSongs + 1 : 1,
            });
          });

        return rtnSong;
      })
    );
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

  updateSong(accountId: string, songId: string, song: Song, editingUser: BaseUser): Observable<any> {
    const songForUpdate = new SongFactory(editingUser).getForUpdate(song);
    const dbPath = `/accounts/${accountId}/songs`;
    const songsRef = this.db.collection(dbPath);
    
    return from(songsRef.doc(songId).update(songForUpdate));
  }

  removeSong(
    songToDelete: Song,
    accountId: string,
    editingUser: BaseUser
  ): any {
    const dbPath = `/accounts/${accountId}/songs`;
    const songsCollection = this.db.collection(dbPath);
    return from(songsCollection.doc(songToDelete.id).delete()).pipe(
      map((result) => {
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
      })
    );
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
