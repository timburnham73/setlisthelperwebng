import { OrderByDirection } from 'firebase/firestore';
import { Artist } from '../model/artist';
import { BaseUser } from '../model/user';

export namespace ArtistActions {
  export class LoadArtists {
    public static readonly type = '[Artists] Load Artists';
    constructor(
      public accountId: string,
      public sortField: string = 'name',
      public sortOrder: OrderByDirection = 'asc'
    ) {}
  }

  export class GetArtist {
    public static readonly type = '[Artists] Get Artist';
    constructor(public accountId: string, public name: string) {}
  }

  export class AddArtist {
    public static readonly type = '[Artists] Add Artist';
    constructor(
      public accountId: string,
      public name: string,
      public countOfSongs: number,
      public editingUser: BaseUser
    ) {}
  }

  export class UpdateArtist {
    public static readonly type = '[Artists] Update Artist';
    constructor(
      public accountId: string,
      public artistId: string,
      public name: string,
      public countOfSongs: number,
      public editingUser: BaseUser
    ) {}
  }
}
