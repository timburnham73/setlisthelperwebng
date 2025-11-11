import { OrderByDirection } from 'firebase/firestore';
import { Song } from '../model/song';
import { BaseUser } from '../model/user';

export namespace SongActions {
  export class LoadSongs {
    public static readonly type = '[Songs] Load Songs';
    constructor(
      public accountId: string,
      public sortField: string,
      public sortOrder: OrderByDirection = 'asc'
    ) {}
  }

  export class LoadSongsByTags {
    public static readonly type = '[Songs] Load Songs By Tags';
    constructor(
      public accountId: string,
      public sortField: string,
      public tagNames: string[],
      public sortOrder: OrderByDirection = 'asc'
    ) {}
  }

  export class GetSong {
    public static readonly type = '[Songs] Get Song';
    constructor(public accountId: string, public songId: string) {}
  }

  export class AddSong {
    public static readonly type = '[Songs] Add Song';
    constructor(
      public accountId: string,
      public song: Song,
      public editingUser: BaseUser
    ) {}
  }

  export class UpdateSong {
    public static readonly type = '[Songs] Update Song';
    constructor(
      public accountId: string,
      public songId: string,
      public song: Song,
      public editingUser: BaseUser
    ) {}
  }

  export class SetDefaultLyricForUser {
    public static readonly type = '[Songs] Set Default Lyric For User';
    constructor(
      public accountId: string,
      public song: Song,
      public lyricId: string,
      public editingUser: BaseUser
    ) {}
  }

  export class RemoveSong {
    public static readonly type = '[Songs] Remove Song';
    constructor(
      public accountId: string,
      public songToDelete: Song,
      public editingUser: BaseUser
    ) {}
  }
}
