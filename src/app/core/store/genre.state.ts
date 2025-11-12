import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { append, patch, updateItem } from '@ngxs/store/operators';
import { from, map, Observable, tap } from 'rxjs';

import { Genre } from '../model/genre';
import { GenreActions } from './genre.actions';
import { GenreFactory } from '../model/factory/genre.factory';
import { BaseUser } from '../model/user';

export interface GenreStateModel {
  genres: Genre[];
  selectedGenre: Genre | null;
  loading: boolean;
  error: any;
}

@State<GenreStateModel>({
  name: 'genres',
  defaults: {
    genres: [],
    selectedGenre: null,
    loading: false,
    error: null,
  },
})
@Injectable()
export class GenreState {
  constructor(private db: AngularFirestore) {}

  @Selector()
  static all(state: GenreStateModel): Genre[] {
    return state.genres;
  }

  @Selector()
  static selected(state: GenreStateModel): Genre | null {
    return state.selectedGenre;
  }

  @Selector()
  static loading(state: GenreStateModel): boolean {
    return state.loading;
  }

  @Action(GenreActions.LoadGenres)
  loadGenres(
    { setState }: StateContext<GenreStateModel>,
    { accountId, sortField, sortOrder }: GenreActions.LoadGenres
  ): Observable<Genre[]> {
    setState(patch({ loading: true, error: null }));

    const dbPath = `/accounts/${accountId}/genres`;
    const col = this.db.collection<Genre>(dbPath, (ref) =>
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
      tap((genres) => setState(patch({ genres, loading: false })))
    );
  }

  @Action(GenreActions.GetGenre)
  getGenre(
    { setState }: StateContext<GenreStateModel>,
    { accountId, name }: GenreActions.GetGenre
  ): Observable<Genre | undefined> {
    setState(patch({ loading: true, error: null }));
    const dbPath = `/accounts/${accountId}/genres`;
    const nameLowered = name.toLowerCase();
    const col = this.db.collection<Genre>(dbPath, (ref) =>
      ref.where('nameLowered', '==', nameLowered).limit(1)
    );

    return col.snapshotChanges().pipe(
      map((changes) => {
        if (!changes.length) return undefined;
        const doc = changes[0].payload.doc;
        const data = doc.data();
        return { id: doc.id, ...data };
      }),
      tap((genre) => setState(patch({ selectedGenre: genre ?? null, loading: false })))
    );
  }

  @Action(GenreActions.AddGenre)
  addGenre(
    { setState }: StateContext<GenreStateModel>,
    { accountId, name, countOfSongs, editingUser }: GenreActions.AddGenre
  ): Observable<Genre> {
    const factory = new GenreFactory(editingUser as BaseUser);
    const genreForAdd = factory.getForAdd({ name, countOfSongs });
    const dbPath = `/accounts/${accountId}/genres`;
    const col = this.db.collection(dbPath);

    return from(col.add(genreForAdd)).pipe(
      map((res) => ({ ...genreForAdd, id: res.id })),
      tap((saved) => setState(patch({ genres: append([saved]) })))
    );
  }

  @Action(GenreActions.UpdateGenre)
  updateGenre(
    { setState }: StateContext<GenreStateModel>,
    { accountId, genreId, name, countOfSongs, editingUser }: GenreActions.UpdateGenre
  ): Observable<void> {
    const factory = new GenreFactory(editingUser as BaseUser);
    const genreForUpdate = factory.getForUpdate({ name, countOfSongs });
    const dbPath = `/accounts/${accountId}/genres`;
    const col = this.db.collection(dbPath);

    return from(col.doc(genreId).update(genreForUpdate)).pipe(
      tap(() =>
        setState(
          patch({
            genres: updateItem<Genre>(
              (g) => !!g && g.id === genreId,
              (g) => ({ ...g!, ...genreForUpdate, id: genreId })
            ),
          })
        )
      )
    );
  }
}
