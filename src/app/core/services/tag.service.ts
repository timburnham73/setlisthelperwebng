import { inject, Injectable } from "@angular/core";
import { from, map, Observable, of, pipe } from "rxjs";
import { Tag, TagHelper } from "../model/tag";
import { OrderByDirection, Timestamp } from "@angular/fire/firestore";

import {
  AngularFirestore,
  AngularFirestoreCollection,
} from "@angular/fire/compat/firestore";
import { BaseUser, User, UserHelper } from "../model/user";
import { ADMIN } from "../model/roles";
import { convertSnaps } from "./db-utils";

//import OrderByDirection = firebase.firestore.OrderByDirection;

@Injectable({
  providedIn: "root",
})
export class TagService {
  private collection = "tags";

  private dbPath = "/tags";

  tagsRef: AngularFirestoreCollection<Tag>;

  constructor(private db: AngularFirestore) {
    this.tagsRef = db.collection(this.dbPath);
  }

  getTag(accountId: string, tagId: string): Observable<any> {
    const dbPath = `/accounts/${accountId}/tags`;
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
    const dbPath = `/accounts/${accountId}/tags`;
    
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

  addTag(tag: Tag, userAddingTheTag: BaseUser): Observable<Tag> {
    const tagToAdd = TagHelper.getForAdd(userAddingTheTag, tag);
    tagToAdd.dateCreated = Timestamp.fromDate(new Date());

    let save$: Observable<any>;
    save$ = from(this.tagsRef.add(tagToAdd));
    
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

  addTagsToTag(tag: Tag) {
    const tagTagsRef = this.tagsRef
      .doc(tag.id)
      .collection("/tags");
    
  }
}
