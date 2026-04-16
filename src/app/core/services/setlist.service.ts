import { Injectable } from '@angular/core';
import { forkJoin, from, map, Observable, of, switchMap, take, tap } from "rxjs";
import { OrderByDirection, Timestamp } from "@angular/fire/firestore";
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Setlist, SetlistHelper } from '../model/setlist';
import { Account } from '../model/account';
import { BaseUser } from '../model/user';
import { SetlistPrintSettings } from '../model/setlist-print-settings';

export enum PrintColumns {
  one,
  two,
  three
}

@Injectable({
  providedIn: 'root'
})
export class SetlistService {

  constructor(private db: AngularFirestore) { }


  getSetlist(accountId: string, setlistId: string): Observable<Setlist | undefined> {
    const dbPath = `/accounts/${accountId}/setlists`;
    const setlistsRef = this.db.collection(dbPath).doc(setlistId);
    return setlistsRef.snapshotChanges().pipe(
      map((resultSetlist) =>
          {
            const setlist = resultSetlist.payload.data() as Setlist;
            if(setlist){
              setlist.id = setlistId;
              return setlist;
            }
            return undefined;
          }
      )
    );
  }

  getSetlists(accountId: string, sortField: string, sortOrder: OrderByDirection = 'desc'): Observable<any> {
    const dbPath = `/accounts/${accountId}/setlists`;
    const setlistsRef = this.db.collection(dbPath, ref => ref.orderBy(sortField, sortOrder));
    return setlistsRef.snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          {
            const setlist = c.payload.doc.data() as Setlist;
            setlist.id = c.payload.doc.id;
            return setlist;
          }
        )
      ),
      map(setlists => setlists.filter(s => !s.deprecated && !(s as any).deleted))
    );
  }

  addSetlist(accountId: string, setlist: Partial<Setlist>, editingUser: BaseUser): any {
    const setlistForUpdate = SetlistHelper.getForAdd(setlist, editingUser);
    
    const dbPath = `/accounts/${accountId}/setlists`;
    const setlistsRef = this.db.collection(dbPath);
    
    return from(setlistsRef.add(setlistForUpdate)).pipe(
      map((result) => {
        const rtnSetlist = {
          id: result.id,
          ...setlist,
        };
        const accountRef = this.db.doc(`/accounts/${accountId}`);
        accountRef
        .valueChanges()
          .pipe(take(1))
          .subscribe((result) => {
            const account = result as Account;
            accountRef.update({
              countOfSetlists: account.countOfSetlists ? account.countOfSetlists + 1 : 1,
            });
          });

        return rtnSetlist;
      })
    );
  }

  updateSetlist(accountId: string, setlistId: string, setlist: Partial<Setlist>, editingUser: BaseUser): Observable<void> {
    const setlistForUpdate = SetlistHelper.getForUpdate(setlist, editingUser);
    
    const dbPath = `/accounts/${accountId}/setlists`;
    const setlistsRef = this.db.collection(dbPath);
    
    return from(setlistsRef.doc(setlistId).update(setlistForUpdate));
  }

  duplicateSetlist(
    accountId: string,
    source: Setlist,
    editingUser: BaseUser
  ): Observable<Setlist> {
    const sourceId = source.id!;
    const setlistsPath = `/accounts/${accountId}/setlists`;
    const songsPath = `/accounts/${accountId}/setlists/${sourceId}/songs`;
    const accountRef = this.db.doc(`/accounts/${accountId}`);

    const newSetlistData = SetlistHelper.getForAdd(
      {
        name: `${source.name} (Copy)`,
        gigLocation: '',
        gigDate: null as any,
        deprecated: false,
        makePublic: false,
      },
      editingUser
    );

    const newSetlistDocRef = this.db.firestore.collection(setlistsPath).doc();
    const newSetlistId = newSetlistDocRef.id;

    return from(this.db.firestore.collection(songsPath).get()).pipe(
      switchMap((songsSnap) => {
        const batch = this.db.firestore.batch();

        batch.set(newSetlistDocRef, newSetlistData);

        // Track (songId -> new setlistSong doc id) for non-break songs so we
        // can add setlist refs on master song docs afterward.
        const songRefMap: { songId: string; setlistSongId: string }[] = [];
        const newSongsCollectionPath = `/accounts/${accountId}/setlists/${newSetlistId}/songs`;

        songsSnap.forEach((doc) => {
          const setlistSong = doc.data() as any;
          const newSongDocRef = this.db.firestore.collection(newSongsCollectionPath).doc();
          const cloned = { ...setlistSong };
          delete cloned.id;
          cloned.lastEdit = Timestamp.fromDate(new Date());
          cloned.lastUpdatedByUser = editingUser;
          batch.set(newSongDocRef, cloned);

          if (!setlistSong.isBreak && setlistSong.songId) {
            songRefMap.push({ songId: setlistSong.songId, setlistSongId: newSongDocRef.id });
          }
        });

        return from(batch.commit()).pipe(
          switchMap(() => {
            const newSetlistForRef: Setlist = { ...newSetlistData, id: newSetlistId } as Setlist;
            const refUpdates = songRefMap.map(({ songId, setlistSongId }) => {
              const songDocRef = this.db.firestore.doc(`/accounts/${accountId}/songs/${songId}`);
              return songDocRef.get().then((songSnap) => {
                if (!songSnap.exists) return;
                const song = songSnap.data() as any;
                const existing = song.setlists || [];
                existing.push({
                  id: newSetlistId,
                  name: newSetlistForRef.name,
                  setlistSongId,
                });
                return songDocRef.update({ setlists: existing });
              });
            });
            return from(Promise.all(refUpdates)).pipe(
              switchMap(() => accountRef.valueChanges().pipe(take(1))),
              tap((result) => {
                const account = result as Account;
                accountRef.update({
                  countOfSetlists: account.countOfSetlists ? account.countOfSetlists + 1 : 1,
                });
              }),
              map(() => newSetlistForRef)
            );
          })
        );
      })
    );
  }

  removeSetlist(
    setlistToDelete: Setlist,
    accountId: string,
    editingUser: BaseUser
  ): any {
    const setlistId = setlistToDelete.id!;
    const songsPath = `/accounts/${accountId}/setlists/${setlistId}/songs`;
    const printSettingsPath = `/accounts/${accountId}/setlists/${setlistId}/printsettings`;
    const setlistDocRef = this.db.firestore.doc(`/accounts/${accountId}/setlists/${setlistId}`);
    const accountRef = this.db.doc(`/accounts/${accountId}`);

    const songs$ = from(this.db.firestore.collection(songsPath).get());
    const printSettings$ = from(this.db.firestore.collection(printSettingsPath).get());

    return forkJoin([songs$, printSettings$]).pipe(
      switchMap(([songsSnap, printSettingsSnap]) => {
        const batch = this.db.firestore.batch();

        // Collect unique songIds that need setlist ref removal
        const songIds = new Set<string>();
        songsSnap.forEach((doc) => {
          const setlistSong = doc.data();
          if (!setlistSong['isBreak'] && setlistSong['songId']) {
            songIds.add(setlistSong['songId']);
          }
          batch.delete(doc.ref);
        });

        // Delete print settings docs
        printSettingsSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete the setlist doc
        batch.delete(setlistDocRef);

        // Remove setlist refs from master songs
        const refUpdates = Array.from(songIds).map((songId) => {
          const songDocRef = this.db.firestore.doc(`/accounts/${accountId}/songs/${songId}`);
          return songDocRef.get().then((songSnap) => {
            if (songSnap.exists) {
              const song = songSnap.data() as any;
              if (song.setlists && song.setlists.length > 0) {
                const filtered = song.setlists.filter((ref: any) => ref.id !== setlistId);
                return songDocRef.update({ setlists: filtered });
              }
            }
            return Promise.resolve();
          });
        });

        return from(Promise.all(refUpdates)).pipe(
          switchMap(() => from(batch.commit()))
        );
      }),
      switchMap(() => accountRef.valueChanges().pipe(take(1))),
      tap((result) => {
        const account = result as Account;
        accountRef.update({
          countOfSetlists: account.countOfSetlists ? account.countOfSetlists - 1 : 0,
        });
      })
    );
  }

  
  addSetlistPrintSettings(accountId: string, setlistId: string,  setlistPrintSettings: SetlistPrintSettings){
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/printsettings`;
    
    const setlistsPringSettingsRef = this.db.collection(dbPath);
    return from(setlistsPringSettingsRef.add(setlistPrintSettings)).pipe(
      map((result) => {
        const rtnSettings = {
          ...setlistPrintSettings,
          id: result.id,
        };
        return rtnSettings;
      })
    );
  }

  updateSetlistPrintSettings(accountId: string, setlistId: string,  setlistPrintSettings: SetlistPrintSettings): Observable<SetlistPrintSettings>{
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/printsettings`;
    
    const setlistsPringSettingsRef = this.db.collection(dbPath);
    return from(setlistsPringSettingsRef.doc(setlistPrintSettings.id).update(setlistPrintSettings)).pipe(
      map(() => {
        return setlistPrintSettings;
      }
    ));
  }

  setPrintSettings(accountId: string, setlistId: string,  setlistPrintSettings: SetlistPrintSettings) {
    if(setlistPrintSettings && setlistPrintSettings.id){
      return this.updateSetlistPrintSettings(accountId, setlistId,  setlistPrintSettings);
    }
    else{
      return this.addSetlistPrintSettings(accountId, setlistId,  setlistPrintSettings);
    }
  }


  getSetlistPrintSettings(accountId: string, setlistId: string): Observable<SetlistPrintSettings[] | undefined>{
    const dbPath = `/accounts/${accountId}/setlists/${setlistId}/printsettings`;
    const setlistPrintSettingsRef = this.db.collection(dbPath);
    return setlistPrintSettingsRef.snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          {
            const setlistPrintSettings = c.payload.doc.data() as SetlistPrintSettings;
            setlistPrintSettings.id = c.payload.doc.id;
            return setlistPrintSettings;
          }
        )
      )
    );
  }
}
