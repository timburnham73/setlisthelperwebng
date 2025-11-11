import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { Timestamp } from "@angular/fire/firestore";

export interface Tag extends Base {
  countOfSongs: number;
}

export class TagHelper{
  static getForAdd(user: BaseUser, tag: Tag): Tag {
    const tagForAdd = this.getForUpdate(user, tag);
    tagForAdd.dateCreated = Timestamp.fromDate(new Date());
    tagForAdd.createdByUser = user;

    return tagForAdd;
  }

  static getForUpdate(user: BaseUser, data: Tag): Tag {
        return {
          name: data.name ?? "",
          nameLowered: data.name.toLocaleLowerCase() ?? "",
          createdByUser: data.createdByUser ?? "",
          dateCreated: data.dateCreated ?? "",
          lastEdit: Timestamp.fromDate(new Date()),
          lastUpdatedByUser: user,
          countOfSongs: data.countOfSongs ?? 0,
        };
      }
}