import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { Timestamp } from "firebase-admin/firestore";
import { SetlistSongRef } from "./setlist";

export interface Song extends Base {
  artist: string;
  artistLowered: string;
  genre: string;
  genreLowered: string;
  key: string;
  keyLowered: string;
  songLength: number;
  tempo: number;
  deactivated: boolean;
  deleted: boolean;
  notes: string;
  other: string;
  noteValue: number;
  beatValue: number;
  youTubeUrl: string;
  lengthMin: number;
  lengthSec: number;
  countOfLyrics: number;
  tags: string[];
  setlists: SetlistSongRef[];
}

export class SongHelper {
  static getForAdd(song: Song, editingUser: BaseUser): Song {
    const songForAdd = this.getForUpdate(song, editingUser);
    songForAdd.createdByUser = UserHelper.getForUpdate(editingUser);
    songForAdd.dateCreated = Timestamp.now();

    return songForAdd;
  }

  static getForUpdate(data: Song, editingUser: BaseUser): Song {
    return {
      name: data.name ?? "",
      nameLowered: (data.name ?? "").toLowerCase(),
      artist: data.artist ?? "",
      artistLowered: (data.artist ?? "").toLowerCase(),
      genre: data.genre ?? "",
      genreLowered: (data.genre ?? "").toLowerCase(),
      key: data.key ?? "",
      keyLowered: (data.key ?? "").toLowerCase(),
      songLength: data.songLength ?? 0,
      tempo: data.tempo ?? 120,
      deactivated: data.deactivated ?? false,
      deleted: data.deleted ?? false,
      notes: data.notes ?? "",
      other: data.other ?? "",
      noteValue: data.noteValue ?? 0,
      beatValue: data.beatValue ?? 0,
      youTubeUrl: data.youTubeUrl ?? "",
      lastEdit: Timestamp.now(),
      lastUpdatedByUser: UserHelper.getForUpdate(editingUser),
      dateCreated: data.dateCreated ?? Timestamp.now(),
      createdByUser: data.createdByUser ?? UserHelper.getForUpdate(editingUser),
      lengthMin: data.lengthMin ?? 3,
      countOfLyrics: data.countOfLyrics ?? 0,
      lengthSec: data.lengthSec ?? 0,
      tags: data.tags ?? [],
      setlists: data.setlists ?? [],
    };
  }
}
