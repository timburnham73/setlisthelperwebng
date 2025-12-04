
import {Timestamp} from "firebase-admin/firestore";
import {Base} from "./base";
import {BaseUser, UserHelper} from "./user";

export interface SetlistBreak extends Base {
   sequenceNumber: number;
   songId: string;
   isBreak: boolean;
   notes: string;
   lengthMin: number;
   lengthSec: number;
   breakTime: number;
   totalTimeInSeconds: number;
   countOfSongs: number;
}

export class SetlistBreakHelper {
  // Just exclude the id
  static getSetlistBreakForAdd(setlistBreak: Partial<SetlistBreak>, editingUser: BaseUser): Partial<SetlistBreak> {
    return {
      sequenceNumber: setlistBreak.sequenceNumber ?? 1,
      songId: setlistBreak.songId ?? "",
      isBreak: true,
      name: setlistBreak.name ?? "",
      nameLowered: (setlistBreak.name ?? "").toLowerCase(),
      notes: setlistBreak.notes ?? "",
      lengthMin: setlistBreak.lengthMin ?? 10,
      lengthSec: setlistBreak.lengthSec ?? 0,
      breakTime: setlistBreak.breakTime ?? 0,
      lastEdit: Timestamp.now(),
      lastUpdatedByUser: UserHelper.getForUpdate(editingUser),
      dateCreated: Timestamp.now(),
      createdByUser: UserHelper.getForUpdate(editingUser),
      totalTimeInSeconds: setlistBreak.totalTimeInSeconds ?? 0,
      countOfSongs: setlistBreak.countOfSongs ?? 0,
    };
  }
}
