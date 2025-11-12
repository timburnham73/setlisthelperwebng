import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';
import { Genre } from '../model/genre';

@Injectable({
  providedIn: 'root',
})
export class GenreService {
  constructor(private db: AngularFirestore) {}

  getGenre(accountId: string, name: string): Observable<Genre | undefined> {
    const dbPath = `/accounts/${accountId}/genres`;
    const nameLowered = name.toLowerCase();
    const col = this.db.collection<Genre>(dbPath, (ref) =>
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
