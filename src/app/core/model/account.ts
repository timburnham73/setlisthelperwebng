import { Timestamp } from "@angular/fire/firestore";
import { Base } from './base';
import { BaseUser, UserHelper } from "./user";
import { LyricFormat } from "./lyric-format";

export interface Account extends Base{
    description?: string;
    users?: string[];
    ownerUser: any;
    importToken: string; 
    countOfSetlists: number;
    countOfSongs: number;
    countOfTags: number;
    formatSettings: LyricFormat;
}

export class AccountHelper{
  static getForAdd(user: BaseUser, account: Account): Account {
    const accountForAdd = this.getForUpdate(user, account);
    accountForAdd.dateCreated = Timestamp.fromDate(new Date());
    accountForAdd.createdByUser = user;
    accountForAdd.ownerUser = UserHelper.getForUpdate(user);

    return accountForAdd;
  }

  static getForUpdate(user: BaseUser, data: Account): Account {
        return {
          name: data.name ?? "",
          nameLowered: data.name?.toLocaleLowerCase() ?? "",
          description: data.description ?? "",
          users: data.users ?? [],
          ownerUser: data.ownerUser ?? undefined,
          createdByUser: data.createdByUser ?? "",
          dateCreated: data.dateCreated ?? "",
          lastEdit: Timestamp.fromDate(new Date()),
          lastUpdatedByUser: user,
          importToken: data.importToken ?? "",
          countOfSetlists: data.countOfSetlists ?? 0,
          countOfTags: data.countOfTags ?? 0,
          countOfSongs: data.countOfSongs ?? 0,
          formatSettings: data.formatSettings ?? 0
        };
      }
}