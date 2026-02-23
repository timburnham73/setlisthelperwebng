import { inject, Injectable } from "@angular/core";
import { combineLatest, concatMap, forkJoin, first, from, map, Observable, of, pipe, switchMap, tap } from "rxjs";
import { Tag, TagHelper } from "../model/tag";
import { OrderByDirection, Timestamp } from "@angular/fire/firestore";

import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { BaseUser, User, UserHelper } from "../model/user";

import { SongService } from "./song.service";
import { Song } from "../model/song";
import { SongFactory } from "../model/factory/song.factory";

//import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
  providedIn: "root",
})
export class TagService {
  collectionName = "tags";
  
  constructor(
    private db: AngularFirestore, 
    private songService: SongService) {
    
  }

  getTag(accountId: string, tagId: string): Observable<any> {
    const dbPath = `/accounts/${accountId}/${this.collectionName}`;
    const tagRef = this.db.collection(dbPath).doc(tagId);
    return tagRef.snapshotChanges().pipe(
      map((resultTag) =>
          {
            const tag = resultTag.payload.data() as Tag;
            tag.id = tagId;
            return tag;
          }
      )
    );
  }

  getTags(accountId: string, sortField: string, sortOrder: OrderByDirection = 'asc'): Observable<Tag[]> {
    const dbPath = `/accounts/${accountId}/${this.collectionName}`;
    
    const tagsRef = this.db.collection(dbPath, ref => ref.orderBy(sortField, sortOrder));
    
    return tagsRef.snapshotChanges().pipe(
      map((changes) =>
      changes.map((c) => {
        const tag = c.payload.doc.data() as Tag;
        tag.id = c.payload.doc.id;
        return tag;
      })
    )
    );
  }

  addTag(accountId: string, tag: Tag, userAddingTheTag: BaseUser): Observable<Tag> {
    const tagToAdd = TagHelper.getForAdd(userAddingTheTag, tag);
    tagToAdd.dateCreated = Timestamp.fromDate(new Date());

    const dbPath = `/accounts/${accountId}/${this.collectionName}`;
    const tagsRef = this.db.collection(dbPath);

    return from(tagsRef.add(tagToAdd)).pipe(
      map((res) => {
        const rtnTag = {
          id: res.id,
          ...tagToAdd,
        };
        return rtnTag;
      }),
      switchMap((rtnTag) => this.recomputeAccountTagCount(accountId).pipe(
        map(() => rtnTag)
      ))
    );
  }

  updateTag(accountId: string, tagId: string, user: BaseUser, data: Tag): Observable<void> {
    const dbPath = `/accounts/${accountId}/${this.collectionName}`;
    const tagsRef = this.db.collection(dbPath);
    const tagForUpdate = TagHelper.getForUpdate(user, data);

    return from(tagsRef.doc(tagId).update(tagForUpdate));
  }

  addTagsToSongs(songs: Song[], accountId: string, tags: string[], editingUser: BaseUser) {
    const songIds = songs.map(song => song.id);
    return this.songService.getSongs(accountId, 'name').pipe(
      first(),
      concatMap((results: Song[]) => {
        const songs = results;
        const batch = this.db.firestore.batch();
        songs.forEach((song, index) => {
          if(song.id){
            if(songIds.includes(song.id)){
              const dbPath = `/accounts/${accountId}/songs`;
              const songsRef = this.db.collection(dbPath);
              const songToUpdate = new SongFactory(editingUser).getForUpdate(song);
              tags.forEach((tag) => {
                const tagIndex = songToUpdate.tags.findIndex((tagInSong) => tagInSong === tag);
                const canAdd = songToUpdate.tags.length === 0 ||  tagIndex === -1;
                if(canAdd){
                  songToUpdate.tags.push(tag.toLowerCase());
                }
              });
              batch.update(songsRef.doc(song.id).ref, songToUpdate);
            }
          }
        });

        return from(batch.commit()).pipe(
          switchMap(() => this.recomputeTagSongCounts(accountId, tags))
        );
      })
    );
  }

  renameTag(accountId: string, tagNameOld: string, tagNameNew: Tag, editingUser: BaseUser){
    return combineLatest([
      this.updateTag(accountId, tagNameNew.id!, editingUser, tagNameNew), 
      this.renameTagInSongs(accountId,tagNameOld, tagNameNew,editingUser)
    ]);
  }

  renameTagInSongs(accountId: string, tagNameOld: string, tagNameNew: Tag, editingUser: BaseUser) {
    
    return this.songService.getSongsByTags(accountId, "name", [tagNameOld]).pipe(
      first(),
      concatMap((results: Song[]) => {
        const songs = results;
        const batch = this.db.firestore.batch();
        songs.forEach((song, index) => {
          if(song.id){
            
              const dbPath = `/accounts/${accountId}/songs`;
              const songsRef = this.db.collection(dbPath);
              const songToUpdate = new SongFactory(editingUser).getForUpdate(song);
              
              const tagIndex = songToUpdate.tags.findIndex((tagInSong) => tagInSong === tagNameOld);
              const canRename = tagIndex > -1;
              if(canRename){
                songToUpdate.tags.splice(tagIndex,1);
                songToUpdate.tags.push(tagNameNew.name);
              }
            
              batch.update(songsRef.doc(song.id).ref, songToUpdate);
            
          }
        });

        //Batch commit incrementing the tag song sequence number.
        return from(batch.commit()).pipe(
          tap(
            //TODO: Update the tag statisitcs 
          )
        );
      })
    );
  }

  removeTag(
    tagToDelete: Tag,
    accountId: string,
    editingUser: BaseUser
  ): any {
    const dbPath = `/accounts/${accountId}/${this.collectionName}`;
    const songsCollection = this.db.collection(dbPath);
    return from(songsCollection.doc(tagToDelete.id).delete()).pipe(
      switchMap(() => this.recomputeAccountTagCount(accountId)),
      switchMap(() => this.songService.getSongsByTags(accountId, 'name', [tagToDelete.name])
                          .pipe(first())),
      switchMap((results: Song[]) => {
        const songs = results;
        const batch = this.db.firestore.batch();
        songs.forEach((song, index) => {
          if(song.id){
            const dbPath = `/accounts/${accountId}/songs`;
            const songsRef = this.db.collection(dbPath);
            const songToUpdate = new SongFactory(editingUser).getForUpdate(song);
            const tagIndex = songToUpdate.tags.findIndex((tagInSong) => tagInSong === tagToDelete.name);
            if(songToUpdate.tags.length !== 0 || tagIndex > -1){
              songToUpdate.tags.splice(tagIndex, 1);
            }

            batch.update(songsRef.doc(song.id).ref, songToUpdate);
          }
        });

        return from(batch.commit());
      })
    );
    
  }


  removeTagsToSongs(songs: Song[], accountId: string, tags: string[], editingUser: BaseUser) {
    const songIdsToRemoveTags = songs.map(song => song.id);
    return this.songService.getSongs(accountId, 'name').pipe(
      first(),
      concatMap((results: Song[]) => {
        const songs = results;
        const batch = this.db.firestore.batch();
        songs.forEach((song, index) => {
          if(song.id){
            if(songIdsToRemoveTags.includes(song.id)){
              const dbPath = `/accounts/${accountId}/songs`;
              const songsRef = this.db.collection(dbPath);
              const songToUpdate = new SongFactory(editingUser).getForUpdate(song);
              tags.forEach((tag) => {
                const tagIndex = songToUpdate.tags.findIndex((tagInSong) => tagInSong === tag);
                if(songToUpdate.tags.length !== 0 || tagIndex > -1){
                  songToUpdate.tags.splice(tagIndex, 1);
                }
              });
              batch.update(songsRef.doc(song.id).ref, songToUpdate);
            }
          }
        });

        return from(batch.commit()).pipe(
          switchMap(() => this.recomputeTagSongCounts(accountId, tags))
        );
      })
    );
  }

  private recomputeTagSongCounts(accountId: string, tagNames: string[]): Observable<void> {
    if (tagNames.length === 0) return of(undefined as void);

    const updates$ = tagNames.map(tagName => {
      const songsPath = `/accounts/${accountId}/songs`;
      const songsQuery = this.db.firestore.collection(songsPath)
        .where('deleted', '==', false)
        .where('tags', 'array-contains', tagName);

      const tagsPath = `/accounts/${accountId}/${this.collectionName}`;
      const tagQuery = this.db.firestore.collection(tagsPath)
        .where('nameLowered', '==', tagName);

      return from(Promise.all([songsQuery.get(), tagQuery.get()])).pipe(
        tap(([songsSnap, tagSnap]) => {
          const count = songsSnap.docs.filter(doc => {
            const data = doc.data();
            return !data['deactivated'];
          }).length;
          tagSnap.forEach(tagDoc => {
            tagDoc.ref.update({ countOfSongs: count });
          });
        })
      );
    });

    return forkJoin(updates$).pipe(map(() => undefined as void));
  }

  private recomputeAccountTagCount(accountId: string): Observable<void> {
    const tagsPath = `/accounts/${accountId}/${this.collectionName}`;
    const accountRef = this.db.doc(`/accounts/${accountId}`);
    return from(this.db.firestore.collection(tagsPath).get()).pipe(
      switchMap((snap) => from(accountRef.update({ countOfTags: snap.size })))
    );
  }
}
