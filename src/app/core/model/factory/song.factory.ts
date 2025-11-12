import { BaseUser } from "../user";
import { BaseFactory } from "./base.factory";
import { Song } from "../song";

export class SongFactory extends BaseFactory<Song> {
  constructor(user: BaseUser) {
    super(user);
  }

  private mapSongFields(data: Partial<Song>): Partial<Song> {
    return {
      artist: data.artist ?? "",
      artistLowered: data.artist ? data.artist.toLowerCase() : "",
      genre: data.genre ?? "",
      genreLowered: data.genre ? data.genre.toLowerCase() : "",
      key: data.key ?? "",
      keyLowered: data.key ? data.key.toLowerCase() : "",
      songLength: data.songLength ?? 0,
      tempo: data.tempo ?? 120,
      deactivated: data.deactivated ?? false,
      deleted: data.deleted ?? false,
      notes: data.notes ?? "",
      other: data.other ?? "",
      noteValue: data.noteValue ?? 0,
      beatValue: data.beatValue ?? 0,
      youTubeUrl: data.youTubeUrl ?? "",
      lengthMin: data.lengthMin ?? 3,
      countOfLyrics: data.countOfLyrics ?? 0,
      lengthSec: data.lengthSec ?? 0,
      tags: data.tags ?? [],
      defaultLyricForUser: data.defaultLyricForUser ?? [],
      setlists: data.setlists ?? []
    };
  }

  override getForAdd(data: Partial<Song>): Song {
    return {
      ...super.getForAdd(data),
      ...this.mapSongFields(data)
    };
  }

  override getForUpdate(data: Partial<Song>): Song {
    return {
      ...super.getForUpdate(data),
      ...this.mapSongFields(data)
    } as Song;
  }
}
