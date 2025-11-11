import { OrderByDirection } from 'firebase/firestore';
import { Genre } from '../model/genre';
import { BaseUser } from '../model/user';

export namespace GenreActions {
  export class LoadGenres {
    public static readonly type = '[Genres] Load Genres';
    constructor(
      public accountId: string,
      public sortField: string = 'name',
      public sortOrder: OrderByDirection = 'asc'
    ) {}
  }

  export class GetGenreByNameLowered {
    public static readonly type = '[Genres] Get By NameLowered';
    constructor(public accountId: string, public nameLowered: string) {}
  }

  export class AddGenre {
    public static readonly type = '[Genres] Add Genre';
    constructor(
      public accountId: string,
      public genre: Genre,
      public editingUser: BaseUser
    ) {}
  }

  export class UpdateGenre {
    public static readonly type = '[Genres] Update Genre';
    constructor(
      public accountId: string,
      public genreId: string,
      public genre: Genre,
      public editingUser: BaseUser
    ) {}
  }
}
