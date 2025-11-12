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

  export class GetGenre {
    public static readonly type = '[Genres] Get Genre';
    constructor(public accountId: string, public name: string) {}
  }

  export class AddGenre {
    public static readonly type = '[Genres] Add Genre';
    constructor(
      public accountId: string,
      public name: string,
      public countOfSongs: number,
      public editingUser: BaseUser
    ) {}
  }

  export class UpdateGenre {
    public static readonly type = '[Genres] Update Genre';
    constructor(
      public accountId: string,
      public genreId: string,
      public name: string,
      public countOfSongs: number,
      public editingUser: BaseUser
    ) {}
  }
}
