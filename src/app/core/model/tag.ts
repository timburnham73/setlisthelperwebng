import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { Timestamp } from "@angular/fire/firestore";

export interface Tag extends Base {
  countOfSongs: number;
}

export class TagHelper{
  static getForAdd(user: BaseUser, tag: Tag): Tag {
    return {
      ...this.getForUpdate(user, tag),
      dateCreated: Timestamp.fromDate(new Date()),
      createdByUser: user,
    } as Tag;
  }

  static getForUpdate(user: BaseUser, data: Tag): Partial<Tag> {
        return {
          name: data.name ?? "",
          nameLowered: data.name.toLocaleLowerCase() ?? "",
          lastEdit: Timestamp.fromDate(new Date()),
          lastUpdatedByUser: user,
          countOfSongs: data.countOfSongs ?? 0,
        };
      }
}