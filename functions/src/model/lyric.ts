import { Timestamp } from "firebase-admin/firestore";
import { Base } from "./base";
import { BaseUser } from "./user";

export interface Lyric extends Base {
  key: string;
  tempo: number;
  notes: string;
  noteValue: number;
  beatValue: number;
  youTubeUrl: string;
  songId: string;
  lyrics: string;
  transpose: number;
  scrollSpeed: number;
  documentLocation: string;
  documentFileName: string;
  isDocument: boolean;
  dbxDocumentRev: string;
  audioLocation: string;
  audioFileName: string;
  dbxAudioRev: string;
  defaultForUsers: string[];
  pdfScale?: { scale: number; x: number };
  formatScope?: any;
  formatSettings?: any;
}

export interface AccountLyric extends Lyric {
  accountId?: string;
}

export class LyricHelper {
  static getForAdd(data: Partial<Lyric>, editingUser: BaseUser): Lyric {
    const lyricForAdd = {
      ...this.getForUpdate(data, editingUser),
      dateCreated: Timestamp.now(),
      createdByUser: editingUser,
    };
    return lyricForAdd;
  }

  static getForUpdate(data: Partial<Lyric>, editingUser: BaseUser): Lyric {
    return {
      name: data.name ?? "",
      nameLowered: (data.name ?? "").toLowerCase(),
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
      lastUpdatedByUser: editingUser,
      documentLocation: data.documentLocation ?? "",
      documentFileName: data.documentFileName ?? "",
      isDocument: data.isDocument ?? false,
      audioLocation: data.audioLocation ?? "",
      audioFileName: data.audioFileName ?? "",
      transpose: data.transpose ?? 0,
      scrollSpeed: data.scrollSpeed ?? 7,
      dbxDocumentRev: data.dbxDocumentRev ?? "",
      dbxAudioRev: data.dbxAudioRev ?? "",
      ...(data.pdfScale ? { pdfScale: data.pdfScale } : {}),
    };
  }
}
