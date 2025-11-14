import { Timestamp } from "firebase-admin/firestore";
import { Base } from "./base";
import { BaseUser } from "./user";

export interface Artist extends Base {
  countOfSongs: number;
}

  export class ArtistHelper {
    static getForAdd(data: Artist, editingUser: BaseUser): Artist {
      return {
        ...ArtistHelper.getForUpdate(data, editingUser),
      };
    }
    static getForUpdate(data: Artist, editingUser: BaseUser): Artist {
      return {
        name: data.name ?? "",
        nameLowered: (data.name ?? "").toLowerCase(),
        countOfSongs: data.countOfSongs ?? 1,
        lastEdit: Timestamp.fromDate(new Date()),
        lastUpdatedByUser: editingUser,
        createdByUser: data.createdByUser ?? editingUser,  
        dateCreated: data.dateCreated ?? Timestamp.fromDate(new Date()), 
      };
    }
  }
