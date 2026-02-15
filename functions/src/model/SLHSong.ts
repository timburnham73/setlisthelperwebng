import { Timestamp } from "firebase-admin/firestore";
import { Song } from "./song";
import { BaseUser, UserHelper } from "./user";

export enum SongType {
  Song,
  Break
}

export interface SLHArtist {
    ArtistId: number
    Name: string
    Deleted: boolean
  }

export interface SLHGenre {
    GenreId: number
    Name: string
    Description: any
    Deleted: boolean
  }

export interface SLHSong {
    Blob: string
    IosAudioLocation: string
    Deleted: boolean
    NoteValue: number
    BeatValue: number
    Transpose: number
    Other: string
    YouTubeUrl: string
    SongLocation: string
    Artist: SLHArtist
    Genre: SLHGenre
    SongId: number
    SongType: SongType
    Name: string
    GenreId: number
    ArtistId: number
    SongLength: number
    Deprecated: boolean
    Key: string
    Notes: string
    Lyrics: string
    DocumentLocation: string
    CreatedByUserId: string
    LastEdit: string
    Tempo: number
    CreatedByUserName: string
  }

export class SLHSongHelper {
  public static getSongLengthMinSec(SongLength) {
    return {
      minutes: Math.floor(SongLength / 60),
      seconds: SongLength % 60,
    };
  }

  static slhSongToSong(slhSong: SLHSong, editingUser: BaseUser): Song {
    const nowTimestamp = Timestamp.now();
    const songLenSplit = this.getSongLengthMinSec(slhSong.SongLength);
    // If there is a lyrics field and a document location then the lyricCount is 2.
    let lyricCount = slhSong.Lyrics && slhSong.Lyrics.trim().length > 0 ? 1 : 0;
    if (slhSong.DocumentLocation && slhSong.DocumentLocation.trim().length > 0) {
      lyricCount += 1;
    }
    return {
      name: slhSong.Name ?? "",
      nameLowered: slhSong.Name.toLowerCase() ?? "",
      artist: slhSong.Artist?.Name ?? "",
      artistLowered: slhSong.Artist && slhSong.Artist.Name ? slhSong.Artist?.Name.toLowerCase() : "",
      genre: slhSong.Genre && slhSong.Genre.Name ? slhSong.Genre?.Name : "",
      genreLowered: slhSong.Genre && slhSong.Genre.Name ? slhSong.Genre?.Name.toLowerCase() : "",
      key: slhSong.Key ?? "",
      keyLowered: slhSong.Key ? slhSong.Key.toLowerCase() : "",
      songLength: slhSong.SongLength ?? 0,
      tempo: slhSong.Tempo ?? 120,
      deactivated: slhSong.Deprecated ?? false,
      deleted: slhSong.Deleted,
      notes: slhSong.Notes ?? "",
      other: slhSong.Other ?? "",
      noteValue: slhSong.NoteValue ?? 0,
      beatValue: slhSong.BeatValue ?? 0,
      youTubeUrl: slhSong.YouTubeUrl ?? "",
      lastEdit: nowTimestamp,
      lastUpdatedByUser: UserHelper.getForUpdate(editingUser),
      dateCreated: nowTimestamp,
      createdByUser: UserHelper.getForUpdate(editingUser),
      countOfLyrics: lyricCount,
      lengthSec: songLenSplit.seconds ?? 0,
      lengthMin: songLenSplit.minutes ?? 3,
      tags: [],
      setlists: [],
    };
  }
}
