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
    entitlementLevel?: string;
    slhImportCompleted?: boolean;
}

export class AccountHelper{
  static getForAdd(user: BaseUser, account: Account): Account {
    return {
      ...this.getForUpdate(user, account),
      dateCreated: Timestamp.fromDate(new Date()),
      createdByUser: user,
      ownerUser: UserHelper.getForUpdate(user),
    } as Account;
  }

  static getForUpdate(user: BaseUser, data: Account): Partial<Account> {
        return {
          name: data.name ?? "",
          nameLowered: data.name?.toLocaleLowerCase() ?? "",
          description: data.description ?? "",
          users: data.users ?? [],
          ownerUser: data.ownerUser ?? undefined,
          lastEdit: Timestamp.fromDate(new Date()),
          lastUpdatedByUser: user,
          importToken: data.importToken ?? "",
          countOfSetlists: data.countOfSetlists ?? 0,
          countOfTags: data.countOfTags ?? 0,
          countOfSongs: data.countOfSongs ?? 0,
          formatSettings: data.formatSettings ?? 0,
          entitlementLevel: data.entitlementLevel ?? 'free'
        };
      }
}