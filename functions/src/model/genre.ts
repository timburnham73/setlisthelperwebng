import { Timestamp } from "firebase-admin/firestore";
import { Base } from "./base";
import { BaseUser } from "./user";

export interface Genre extends Base {
  countOfSongs: number;
}

export class GenreHelper {
  static getForAdd(data: Genre, editingUser: BaseUser): Genre {
    return {
      ...GenreHelper.getForUpdate(data, editingUser),
    };
  }
  static getForUpdate(data: Genre, editingUser: BaseUser): Genre {
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
