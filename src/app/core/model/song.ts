import { Timestamp } from "@angular/fire/firestore";
import { Base } from "./base";
import { BaseUser } from "./user";
import { SetlistRef, SetlistSongRef } from "functions/src/model/setlist";

export interface UserLyric {
  uid: string;
  lyricId: string;
}
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
  defaultLyricForUser: UserLyric[];
  setlists: SetlistSongRef[];
}
