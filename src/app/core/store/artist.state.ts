import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { append, patch, updateItem } from '@ngxs/store/operators';
import { from, map, Observable, take, tap } from 'rxjs';

import { Artist, ArtistHelper } from '../model/artist';
import { Account } from '../model/account';
import { ArtistActions } from './artist.actions';

export interface ArtistStateModel {
  artists: Artist[];
  selectedArtist: Artist | null;
  loading: boolean;
  error: any;
}

@State<ArtistStateModel>({
  name: 'artists',
  defaults: {
    artists: [],
    selectedArtist: null,
    loading: false,
    error: null,
  },
})
@Injectable()
export class ArtistState {
  constructor(private db: AngularFirestore) {}

  @Selector()
  static all(state: ArtistStateModel): Artist[] {
    return state.artists;
  }

  @Selector()
  static selected(state: ArtistStateModel): Artist | null {
    return state.selectedArtist;
  }

  @Selector()
  static loading(state: ArtistStateModel): boolean {
    return state.loading;
  }

  @Action(ArtistActions.LoadArtists)
  loadArtists(
    { setState }: StateContext<ArtistStateModel>,
    { accountId, sortField, sortOrder }: ArtistActions.LoadArtists
  ): Observable<Artist[]> {
    setState(patch({ loading: true, error: null }));

    const dbPath = `/accounts/${accountId}/artists`;
    const col = this.db.collection<Artist>(dbPath, (ref) =>
      ref.orderBy('deactivated').orderBy(sortField, sortOrder)
    );

    return col.snapshotChanges().pipe(
      map((changes) =>
        changes.map((c) => {
          const data = c.payload.doc.data();
          const id = c.payload.doc.id;
          return { id, ...data };
        })
      ),
      tap((artists) => setState(patch({ artists, loading: false })))
    );
  }

  @Action(ArtistActions.GetArtistByNameLowered)
  getArtistByNameLowered(
    { setState }: StateContext<ArtistStateModel>,
    { accountId, nameLowered }: ArtistActions.GetArtistByNameLowered
  ): Observable<Artist | undefined> {
    setState(patch({ loading: true, error: null }));
    const dbPath = `/accounts/${accountId}/artists`;
    const col = this.db.collection<Artist>(dbPath, (ref) =>
      ref.where('nameLowered', '==', nameLowered).limit(1)
    );

    return col.snapshotChanges().pipe(
      map((changes) => {
        if (!changes.length) return undefined;
        const doc = changes[0].payload.doc;
        const data = doc.data();
        return { id: doc.id, ...data };
      }),
      tap((artist) => setState(patch({ selectedArtist: artist ?? null, loading: false })))
    );
  }

  @Action(ArtistActions.AddArtist)
  addArtist(
    { setState }: StateContext<ArtistStateModel>,
    { accountId, artist, editingUser }: ArtistActions.AddArtist
  ): Observable<Artist> {
    const artistForAdd = ArtistHelper.getForUpdate(editingUser, artist);
    const dbPath = `/accounts/${accountId}/artists`;
    const col = this.db.collection(dbPath);

    return from(col.add(artistForAdd)).pipe(
      map((res) => ({ id: res.id, ...artistForAdd } as any as Artist)),
      tap((saved) => setState(patch({ artists: append([saved]) })))
    );
  }

  @Action(ArtistActions.UpdateArtist)
  updateArtist(
    { setState }: StateContext<ArtistStateModel>,
    { accountId, artistId, artist, editingUser }: ArtistActions.UpdateArtist
  ): Observable<void> {
    const artistForUpdate = ArtistHelper.getForUpdate(editingUser, artist);
    const dbPath = `/accounts/${accountId}/artists`;
    const col = this.db.collection(dbPath);

    return from(col.doc(artistId).update(artistForUpdate)).pipe(
      tap(() =>
        setState(
          patch({
            artists: updateItem<Artist>((a) => (a as any)?.id === artistId, {
              ...(artist as any),
              id: artistId,
            } as any as Artist),
          })
        )
      )
    );
  }
}
