import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';
import { Artist } from '../model/artist';

@Injectable({
  providedIn: 'root',
})
export class ArtistService {
  constructor(private db: AngularFirestore) {}

  getArtist(accountId: string, name: string): Observable<Artist | undefined> {
    const dbPath = `/accounts/${accountId}/artists`;
    const nameLowered = name.toLowerCase();
    const col = this.db.collection<Artist>(dbPath, (ref) =>
      ref.where('nameLowered', '==', nameLowered).limit(1)
    );

    return col.get().pipe(
      map((snapshot) => {
        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        const data = doc.data();
        return { ...data, id: doc.id };
      })
    );
  }
}
