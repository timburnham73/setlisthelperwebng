import { Injectable } from "@angular/core";
import { Timestamp } from "@angular/fire/firestore";
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { Observable, concat, concatMap, first, from, map, switchMap, tap, forkJoin, of } from "rxjs";
import { Song } from "../model/song";
import { SongFactory } from "../model/factory/song.factory";
import { SetlistSong } from "../model/setlist-song";
import { SetlistSongFactory } from "../model/factory/setlist-song.factory";
import { SetlistBreak, SetlistBreakHelper } from "../model/setlist-break";
import { BaseUser } from "../model/user";
import { Setlist } from "../model/setlist";
import { SetlistSongRef } from "functions/src/model/setlist";

@Injectable({
  providedIn: "root",
})
export class SetlistSongService {
  constructor(private db: AngularFirestore) { }

  getOrderedSetlistSongs(accountId: string, setlistId: string): Observable<SetlistSong[]> {
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/songs`;
    const songsRef = this.db.collection(dbPath, (ref) =>
      ref.orderBy("sequenceNumber")
    );
    return songsRef.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => {
          const song = c.payload.doc.data() as SetlistSong;
          song.id = c.payload.doc.id;
          return song;
        })
      )
    );
  }
  
  getSetlistSongsBySongId(accountId: string, songId: string): Observable<SetlistSong[]> {
    return this.db.collectionGroup(`songs`,
      ref => ref.where("songId", "==", songId).where('accountId', '==', accountId)
    )
      .get()
      .pipe(
        map(snaps => {
          const setlistSongs: SetlistSong[] = [];
          snaps.forEach(snap => {
            const fullPath = snap.ref.path;
            const setlistsong = snap.data() as SetlistSong;
            setlistsong.id = snap.id;
            setlistsong.documentPath = fullPath;
            setlistSongs.push(setlistsong);
          })
          return setlistSongs;
        })
      );
  }

  updateSetlistSongsBySongId(accountId: string, songId: string, modifiedSong: Song, editingUser: BaseUser) {
    const setlists = modifiedSong.setlists || [];

    const updates$: Observable<any>[] = setlists.map((setlistRef) => {
      const path = `/accounts/${accountId}/setlists/${setlistRef.id}/songs`;
      const q = this.db.collection(path, (ref) => ref.where('songId', '==', songId));
      return q.get().pipe(
        switchMap((snap) => {
          const ops: Promise<any>[] = [];
          snap.forEach((doc) => {
            const existingSetlistSong = doc.data() as SetlistSong;
            if (existingSetlistSong.updateOnlyThisSetlistSong !== true) {
              const factory = new SetlistSongFactory(editingUser);
              const merged = factory.getForUpdateFromSong(existingSetlistSong, modifiedSong);
              const payload = { ...merged } as any;
              delete payload.id;
              ops.push(doc.ref.update(payload));
            }
          });
          // Also update the setlist's lastEdit
          const setlistDocRef = this.db.doc(`/accounts/${accountId}/setlists/${setlistRef.id}`).ref;
          ops.push(setlistDocRef.update({ lastEdit: Timestamp.fromDate(new Date()) } as any));
          return from(Promise.all(ops));
        })
      );
    });

    if (updates$.length === 0) {
      return of(void 0);
    }

    return forkJoin(updates$);
  }

  // Update specific SetlistSong documents referenced by a Song's setlists array.
  // Uses the setlistSongId on each SetlistSongRef and only updates when
  // updateOnlyThisSetlistSong is not true.
  updateSetlistSongsFromSong(accountId: string, song: Song, editingUser: BaseUser) {
    const setlists: SetlistSongRef[] = song.setlists || [];

    const updates$: Observable<any>[] = setlists.map((setlistRef) => {
      const docPath = `/accounts/${accountId}/setlists/${setlistRef.id}/songs/${setlistRef.setlistSongId}`;
      const doc = this.db.doc(docPath);

      return doc.get().pipe(
        switchMap((snap) => {
          if (!snap.exists) {
            return of(void 0);
          }

          const existingSetlistSong = snap.data() as SetlistSong;
          if (existingSetlistSong.updateOnlyThisSetlistSong === true) {
            return of(void 0);
          }

          const factory = new SetlistSongFactory(editingUser);
          const merged = factory.getForUpdateFromSong(existingSetlistSong, song);
          const payload = { ...merged } as any;
          delete payload.id;

          return from(doc.ref.update(payload)).pipe(
            switchMap(() => from(this.db.doc(`/accounts/${accountId}/setlists/${setlistRef.id}`).ref.update({ lastEdit: Timestamp.fromDate(new Date()) } as any)))
          );
        })
      );
    });

    if (updates$.length === 0) {
      return of(void 0);
    }

    return forkJoin(updates$);
  }

  addSetlistBreak(
    accountId: string,
    setlist: Setlist,
    setlistBreak: Partial<SetlistBreak>,
    editingUser: BaseUser
  ): any {
    const breakForAdd =
      SetlistBreakHelper.getSetlistBreakForAddOrUpdate(setlistBreak, editingUser);
    
    //return a concat observable with the increment and add combined.
    return this.incrementSequenceOfSongs(breakForAdd.sequenceNumber, breakForAdd, accountId, setlist, editingUser).pipe(
      tap(() => {
        const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlist.id}`);
        setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
      })
    );
  }

  addSetlistSong(
    setlistSong: SetlistSong,
    accountId: string,
    setlist: Setlist,
    editingUser: BaseUser
  ): any {
    const songForAdd = new SetlistSongFactory(editingUser).getForUpdate(setlistSong);
    
    if(setlist && setlist.id){
      //return a concat observable with the increment and add combined.
      return this.incrementSequenceOfSongs(songForAdd.sequenceNumber, songForAdd, accountId, setlist, editingUser).pipe(
        tap(() => {
          const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlist.id}`);
          setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
        })
      );
    }
  }

  addSetlistSongs(
    sequenceNumberToInsert: number,
    songsToAdd: Song[],
    accountId: string,
    setlist: Setlist,
    editingUser: BaseUser
  ): any {
    const setlistSongsForadd: SetlistSong[] = [];
    let sequenceNumberForNewSongs = sequenceNumberToInsert;
    for(const songToAdd of songsToAdd){
      const setlistSongToAdd = {
        sequenceNumber: sequenceNumberForNewSongs++,
        ...songToAdd
      } as SetlistSong;
      const songForAdd = new SetlistSongFactory(editingUser).getForUpdate(setlistSongToAdd);
      setlistSongsForadd.push(songForAdd);
    }
    
    if(setlist && setlist.id){
      //return a concat observable with the increment and add combined.
      return this.incrementSequenceOfSongsBatch(sequenceNumberToInsert, setlistSongsForadd, accountId, setlist, editingUser).pipe(
        tap(() => {
          const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlist.id}`);
          setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
        })
      );
    }
  }

  updateSetlistSong(
    setlistSongId: string,
    accountId: string,
    setlistId: string,
    setlistSong: SetlistSong,
    editingUser: BaseUser
  ): any {
    const setlisSongForUpdate = new SetlistSongFactory(editingUser).getForUpdate(
      setlistSong
    );
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/songs`;
    const setlistSongsRef = this.db.collection(dbPath);

    return from(setlistSongsRef.doc(setlistSongId).update(setlisSongForUpdate)).pipe(
      tap(this.updateSetlistSongStatistics(accountId, setlistId!)),
      tap(() => {
        const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlistId}`);
        setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
      })
    );
  }

  removeSetlistSong(
    setlistSongToDelete: SetlistSong,
    accountId: string,
    setlist: Setlist,
    editingUser: BaseUser
  ): any {
    const dbPath = `/accounts/${accountId}/setlists/${setlist.id}/songs`;
    const setlistSongsCollection = this.db.collection(dbPath);
    //Reorder all the songs but the song we are deleting.
    return this.getOrderedSetlistSongs(accountId, setlist.id!).pipe(
      concatMap((results: SetlistSong[]) => {
        const setlistSongs = results;
        const batch = this.db.firestore.batch();
        let startReorder = false; //Start to reorder when we found the song we are deleting.
        setlistSongs.forEach((setlistSong, index) => {
          if (startReorder) {
            //Decrement the sequence since we are deleting one song. 
            this.setSetlistSongSequenceNumberForBatch(
              (setlistSong.sequenceNumber = setlistSong.sequenceNumber - 1),
              setlistSongsCollection,
              setlistSong,
              editingUser,
              batch
            );
          }
          //Start reorder after we found the song we are deleting.
          if (setlistSongToDelete.id === setlistSong.id) {
            startReorder = true;
          }
        });

        const deleteSongRef = setlistSongsCollection.doc(setlistSongToDelete.id).ref;
        batch.delete(deleteSongRef);

        return from(batch.commit()).pipe(
          tap(this.updateSetlistSongStatistics(accountId,setlist.id!)),
          tap(() => {
            const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlist.id}`);
            setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
          }),
          tap(() => {
            // Only remove setlist ref for songs, not breaks
            if (!setlistSongToDelete.isBreak) {
              this.removeSetlistRefInSong(accountId, setlistSongToDelete.songId, setlist).subscribe();
            }
          })
        );
      })
    );
  }

  //When you move up a setlist songs all songs below need to be reordered.
  moveSetlistSong(
    setlistSongToInsert,
    startingSequenceNumber: number,
    accountId: string,
    setlistId: string,
    editingUser: BaseUser,
    moveUp: Boolean = true
  ): any {
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/songs`;
    const setlistSongsRef = this.db.collection(dbPath);
    return this.getOrderedSetlistSongs(accountId, setlistId).pipe(
      concatMap((results: SetlistSong[]) => {
        const setlistSongs = moveUp ? results : results.reverse();
        const batch = this.db.firestore.batch();
        //Once the starting sequence number is found set this to true so the others can be incremented after.
        let isUpdating = false;
        let index = moveUp ? 1 : setlistSongs.length;
        for (const setlistSong of setlistSongs) {
          //Increment the sequence number if the sequenceNumber === startingSequenceNumber or it is updating.
          if (
            index === startingSequenceNumber ||
            (isUpdating && setlistSong.id !== setlistSongToInsert.id)
          ) {
            this.setSetlistSongSequenceNumberForBatch(
              (setlistSong.sequenceNumber = moveUp ? setlistSong.sequenceNumber + 1 : setlistSong.sequenceNumber - 1),
              setlistSongsRef,
              setlistSong,
              editingUser,
              batch
            );

            isUpdating = true;
          } else if (isUpdating && setlistSong.id === setlistSongToInsert.id) {
            this.setSetlistSongSequenceNumberForBatch(
              (setlistSong.sequenceNumber = startingSequenceNumber),
              setlistSongsRef,
              setlistSong,
              editingUser,
              batch
            );
            break;
          }
          index = moveUp ? index + 1 : index - 1;
        }
        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit()).pipe(
          tap(this.updateSetlistSongStatistics(accountId,setlistId)),
          tap(() => {
            const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlistId}`);
            setlistDoc.update({ lastEdit: Timestamp.fromDate(new Date()) } as any);
          })
        );
      })
    );
  }

  //startingSequenceNumber is the currently selected song. All songs after the startingSequence should be incremented. 
  //The new songs sequece should be startingSequenceNumber + 1.
  private incrementSequenceOfSongs(startingSequenceNumber: number, songToAdd: SetlistSong | SetlistBreak, accountId: string, setlist: Setlist, editingUser: BaseUser) {
    const dbPath = `/accounts/${accountId}/setlists/${setlist.id}/songs`;
    const setlistSongsRef = this.db.collection(dbPath);
    return this.getOrderedSetlistSongs(accountId, setlist.id!).pipe(
      first(),
      concatMap((results: SetlistSong[]) => {
        const setlistSongs = results;
        const batch = this.db.firestore.batch();
        setlistSongs.forEach((setlistSong, index) => {
          if (index >= startingSequenceNumber) {
            this.setSetlistSongSequenceNumberForBatch(
              (setlistSong.sequenceNumber = setlistSong.sequenceNumber + 1),
              setlistSongsRef,
              setlistSong,
              editingUser,
              batch
            );
          }
        });
        //Don't increment if the song is added to the end.
        if (setlistSongs.length === 0) {
          songToAdd.sequenceNumber = 1;
        }
        else if (startingSequenceNumber >= setlistSongs.length) {
          //Don't incremnet if there are no songs.
          songToAdd.sequenceNumber = setlistSongs.length + 1;
        }
        else {
          songToAdd.sequenceNumber = startingSequenceNumber + 1;
        }

        const newSetlistSongDocRef = setlistSongsRef.doc();
        (songToAdd as SetlistSong).id = newSetlistSongDocRef.ref.id;
        batch.set(newSetlistSongDocRef.ref, songToAdd);
        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit()).pipe(
          tap(
            this.updateSetlistSongStatistics(accountId,setlist.id!)
          ),
          tap(() => {
            // Only add setlist ref for songs, not breaks
            if (!songToAdd.isBreak) {
              this.addSetlistRefInSong(accountId, songToAdd.songId, songToAdd.id!, setlist).subscribe();
            }
          })
        );
      })
    );
  }

  //startingSequenceNumber is the currently selected song. All songs after the startingSequence should be incremented. 
  //The new songs sequece should be startingSequenceNumber + 1.
  private incrementSequenceOfSongsBatch(startingSequenceNumber: number, songsToAdd: SetlistSong[], accountId: string, setlist: Setlist, editingUser: BaseUser) {
    const dbPath = `/accounts/${accountId}/setlists/${setlist.id}/songs`;
    const setlistSongsRef = this.db.collection(dbPath);
    const songsToAddLen = songsToAdd.length;
    return this.getOrderedSetlistSongs(accountId, setlist.id!).pipe(
      first(),
      concatMap((results: SetlistSong[]) => {
        const setlistSongs = results;
        const batch = this.db.firestore.batch();
        setlistSongs.forEach((setlistSong, index) => {
          if (index >= startingSequenceNumber) {
            this.setSetlistSongSequenceNumberForBatch(
              (setlistSong.sequenceNumber = setlistSong.sequenceNumber + (songsToAddLen +1)),
              setlistSongsRef,
              setlistSong,
              editingUser,
              batch
            );
          }
        });

        for(const songToAdd of songsToAdd){
          //Starting sequence if there are no songs.
          if (setlistSongs.length === 0) {
            songToAdd.sequenceNumber = 1;
          }
          else if (startingSequenceNumber >= setlistSongs.length) {
            //Don't incremnet if there are no songs.
            songToAdd.sequenceNumber = setlistSongs.length + 1;
          }
          else {
            songToAdd.sequenceNumber = startingSequenceNumber + 1;
          }

          const newSetlistSongDocRef = setlistSongsRef.doc();
          songToAdd.id = newSetlistSongDocRef.ref.id;
          batch.set(newSetlistSongDocRef.ref, songToAdd);
        }
        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit()).pipe(
          tap(
            this.updateSetlistSongStatistics(accountId,setlist.id!)
          ),
          tap(() => {
              
              for(const songToAdd of songsToAdd){
                this.addSetlistRefInSong(accountId, songToAdd.songId, songToAdd.id!, setlist)
              }
            }
          )
        );
      })
    );
  }

  private removeSetlistRefInSong(accountId: string, songId: string, setlist: Setlist) {
    const songDoc = this.db.doc(`/accounts/${accountId}/songs/${songId}`);

    return songDoc.get().pipe(
      map((resultSong) =>
          {
            const song = resultSong.data() as Song;
            if(song.setlists){
              const newSetlistRef: SetlistSongRef[] = [];
              let removedOne = false;
              for(const setlistRef of song.setlists) {
                if(setlistRef.id === setlist.id){
                  if(removedOne === true){
                    //There could be multiple songs in the setlist. Just remove one. 
                    newSetlistRef.push({name: setlist.name, id: setlist.id!, setlistSongId: setlistRef.setlistSongId });  
                  }
                  removedOne = true;
                }
                else{
                  newSetlistRef.push({name: setlistRef.name, id: setlistRef.id!, setlistSongId: setlistRef.setlistSongId });  
                }
              }
              song.setlists = newSetlistRef;
              songDoc.update(song);
            }
            
            return song;
          }
      )
    );
  }

  private addSetlistRefInSong(accountId: string, songId: string, setlistSongId: string, setlist: Setlist) {
    const songDoc = this.db.doc(`/accounts/${accountId}/songs/${songId}`);

    return songDoc.get().pipe(
      map((resultSong) =>
          {
            const song = resultSong.data() as Song;
            if(song.setlists){
              song.setlists.push({name: setlist.name, id: setlist.id!, setlistSongId: setlistSongId });
            }
            else{
              song.setlists = [{name: setlist.name, id: setlist.id!, setlistSongId: setlistSongId }];
            }
            songDoc.update(song);
            return song;
          }
      )
    );
  }

  private updateSetlistSongStatistics(accountId: string, setlistId: string) {
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/songs`;
    const setlistSongsRef = this.db.collection(dbPath);
    return this.getOrderedSetlistSongs(accountId, setlistId).pipe(
      first(),
      tap((results: SetlistSong[]) => {
        let songCount = 0;
        let breakCount = 0;
        let totalTimeInSeconds = 0;
        let songCountBeforeBreaks = 0;
        let totalTimeInSecondsBeforeBreaks = 0;
        const setlistSongs = results;
        const batch = this.db.firestore.batch();
        setlistSongs.forEach((setlistSong, index) => {
          if (setlistSong.isBreak === false) {
            songCount++;
            songCountBeforeBreaks++;
            totalTimeInSecondsBeforeBreaks += setlistSong.lengthMin ? setlistSong.lengthMin * 60 : 0;
            totalTimeInSecondsBeforeBreaks += setlistSong.lengthSec ? setlistSong.lengthSec : 0;

          }
          else {
              breakCount++;
              //Update the song count before a break and the total time. 
              const setlistBreakRef = this.db.doc(`/accounts/${accountId}/setlists/${setlistId}/songs/${setlistSong.id}`);
              batch.update(setlistBreakRef.ref, { countOfSongs: songCountBeforeBreaks, totalTimeInSeconds: totalTimeInSecondsBeforeBreaks });
              
              //Reset the counter
              songCountBeforeBreaks = 0;
              totalTimeInSecondsBeforeBreaks = 0;
          }
          totalTimeInSeconds += setlistSong.lengthMin ? setlistSong.lengthMin * 60 : 0;
          totalTimeInSeconds += setlistSong.lengthSec ? setlistSong.lengthSec : 0;
        });
        
        //Used to update the setlist with the song count. The setlist may be deleted and so do not try to update it. 
        const setlistDoc = this.db.doc(`/accounts/${accountId}/setlists/${setlistId}`);
        batch.update(setlistDoc.ref, { countOfSongs: songCount, countOfBreaks: breakCount, totalTimeInSeconds: totalTimeInSeconds });
        
        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit());
      })
    );
  }

  private setSetlistSongSequenceNumberForBatch(
    sequenceNumber: number,
    setlistSongsRef: AngularFirestoreCollection<unknown>,
    setlistSong: SetlistSong,
    editingUser: BaseUser,
    batch
  ) {
    const setlistSongRef = setlistSongsRef.doc(setlistSong.id).ref;
    const setlisSongForUpdate = new SetlistSongFactory(editingUser).getForUpdate(
      setlistSong
    );
    setlisSongForUpdate.sequenceNumber = sequenceNumber;
    setlisSongForUpdate.lastUpdatedByUser = editingUser;
    batch.update(setlistSongRef, setlisSongForUpdate);
  }
}
