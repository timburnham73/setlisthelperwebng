import { inject, Injectable } from "@angular/core";
import { concatMap, first, from, map, Observable, of, pipe, tap } from "rxjs";
import { Tag, TagHelper } from "../model/tag";
import { OrderByDirection, Timestamp } from "@angular/fire/firestore";

import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { BaseUser, User, UserHelper } from "../model/user";
import { ADMIN } from "../model/roles";
import { convertSnaps } from "./db-utils";

import { SongService } from "./song.service";
import { Song, SongHelper } from "../model/song";

//import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
  providedIn: "root",
})
export class TagService {
  collectionName = "tags";
  tagsRef: AngularFirestoreCollection<Tag>;

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

    let save$: Observable<any>;
    save$ = from(tagsRef.add(tagToAdd));
    
    return save$.pipe(
      map((res) => {
        const rtnTag = {
          id: res.id,
          ...tagToAdd,
        };
        return rtnTag;
      })
    );
  }

  updateTag(id: string, user: BaseUser, data: Tag): Observable<void> {
    const tagForUpdate = TagHelper.getForUpdate(user, data);

    return from(this.tagsRef.doc(id).update(tagForUpdate));
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
              const songToUpdate = SongHelper.getForUpdate(song, editingUser);
              tags.forEach((tag) => {
                const tagIndex = songToUpdate.tags.findIndex((tagInSong) => tagInSong === tag);
                const canAdd = songToUpdate.tags.length === 0 ||  tagIndex === -1;
                if(canAdd){
                  songToUpdate.tags.push(tag);
                }
              });
              batch.update(songsRef.doc(song.id).ref, songToUpdate);
            }
          }
        });

        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit()).pipe(
          tap(
            //TODO: Update the tag statisitcs 
          )
        );
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
              const songToUpdate = SongHelper.getForUpdate(song, editingUser);
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

        //Batch commit incrementing the setlist song sequence number.
        return from(batch.commit()).pipe(
          tap(
            //TODO: Update the tag statisitcs 
          )
        );
      })
    );
  }
}
