import { Timestamp } from "firebase-admin/firestore";
import { Base } from "./base";
import { BaseUser } from "./user";

export interface Tag extends Base {
  countOfSongs: number;
}

export class TagHelper {
  static getForAdd(data: Tag, editingUser: BaseUser): Tag {
    return {
      ...TagHelper.getForUpdate(data, editingUser),
    };
  }
  static getForUpdate(data: Tag, editingUser: BaseUser): Tag {
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
