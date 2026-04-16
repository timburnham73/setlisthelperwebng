
import { Timestamp } from "@angular/fire/firestore";
import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";

export interface SetlistBreak extends Base {
   sequenceNumber: number;
   songId: string;
   isBreak: boolean;
   name: string;
   notes: string;
   lengthMin: number;
   lengthSec: number;
   totalTimeInSeconds: number;
   countOfSongs: number;
}

export class SetlistBreakHelper {
   static getSetlistBreakForAdd(setlistBreak: Partial<SetlistBreak>, editingUser: BaseUser): SetlistBreak {
      return {
         ...SetlistBreakHelper.getSetlistBreakForUpdate(setlistBreak, editingUser),
         dateCreated: Timestamp.fromDate(new Date()),
         createdByUser: UserHelper.getForUpdate(editingUser),
      } as SetlistBreak;
   }

   static getSetlistBreakForUpdate(setlistBreak: Partial<SetlistBreak>, editingUser: BaseUser): Partial<SetlistBreak> {
      return {
         name: setlistBreak.name ?? "",
         nameLowered: setlistBreak.name?.toLocaleLowerCase() ?? "",
         sequenceNumber: setlistBreak.sequenceNumber ?? 1,
         songId: setlistBreak.songId ?? "",
         isBreak: setlistBreak.isBreak ?? false,
         lastEdit: Timestamp.fromDate(new Date()),
         lastUpdatedByUser: UserHelper.getForUpdate(editingUser),
         totalTimeInSeconds: setlistBreak.totalTimeInSeconds ?? 0,
         countOfSongs: setlistBreak.countOfSongs ?? 0,
         lengthMin: setlistBreak.lengthMin ?? 10,
         lengthSec: setlistBreak.lengthSec ?? 0,
         notes: setlistBreak.notes ?? ''
      };
   }
}