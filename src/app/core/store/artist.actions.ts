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

  export class GetArtistByNameLowered {
    public static readonly type = '[Artists] Get By NameLowered';
    constructor(public accountId: string, public nameLowered: string) {}
  }

  export class AddArtist {
    public static readonly type = '[Artists] Add Artist';
    constructor(
      public accountId: string,
      public artist: Artist,
      public editingUser: BaseUser
    ) {}
  }

  export class UpdateArtist {
    public static readonly type = '[Artists] Update Artist';
    constructor(
      public accountId: string,
      public artistId: string,
      public artist: Artist,
      public editingUser: BaseUser
    ) {}
  }
}
