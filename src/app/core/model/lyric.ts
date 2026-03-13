import { Timestamp } from "@angular/fire/firestore";
import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { LyricFormat } from "./lyric-format";

//The scope of where to load the saved lyric format
export enum FormatScope {
  LYRIC,
  USER,
  ACCOUNT
} 

export interface Lyric extends Base {
  key: string;
  tempo: number;
  notes: string;
  noteValue: number;
  beatValue: number;
  youTubeUrl: string;
  songId: string;
  lyrics: string;
  defaultForUsers: string[];
  documentLocation: string;
  documentFileName: string;
  isDocument: boolean;
  audioLocation: string;
  audioFileName: string;
  transpose: number;
  scrollSpeed: number;
  pdfScale?: { scale: number; x: number };
  formatScope?: FormatScope;
  formatSettings?: LyricFormat;
}

export interface AccountLyric extends Lyric {
  accountId?: string;
}

export class LyricHelper {
  static getForAdd(data: Lyric, editingUser: BaseUser): Lyric {
    const lyricForAdd = {
      ...this.getForUpdate(data, editingUser),
      dateCreated: Timestamp.fromDate(new Date()),
      createdByUser: editingUser
    };
    return lyricForAdd;
  }

  static getForUpdate(data: Lyric, editingUser: BaseUser): Lyric {
    return {
      name: data.name ?? "",
      nameLowered: data.name.toLocaleLowerCase() ?? "",
      lyrics: data.lyrics ?? "",
      key: data.key ?? "",
      tempo: data.tempo ?? 120,
      notes: data.notes ?? "",
      lastEdit: Timestamp.now(),
      noteValue: data.noteValue ?? 0,
      beatValue: data.beatValue ?? 0,
      youTubeUrl: data.youTubeUrl ?? "",
      songId: data.songId ?? "",
      defaultForUsers: data.defaultForUsers ?? [],
      createdByUser: data.createdByUser ?? editingUser,
      dateCreated: data.dateCreated ?? Timestamp.now(),
      lastUpdatedByUser : UserHelper.getForUpdate(editingUser),
      documentLocation: data.documentLocation ?? "",
      documentFileName: data.documentFileName ?? "",
      isDocument: data.isDocument ?? false,
      audioLocation: data.audioLocation ?? "",
      audioFileName: data.audioFileName ?? "",
      transpose: data.transpose ?? 0,
      scrollSpeed: data.scrollSpeed ?? 7,
      pdfScale: data.pdfScale ?? undefined,
      formatScope: data.formatScope ?? FormatScope.ACCOUNT,
      formatSettings: data.formatSettings ?? undefined

    };
  }
}
