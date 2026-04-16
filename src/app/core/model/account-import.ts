import { Timestamp } from "@angular/fire/firestore";
import { BaseUser, UserHelper } from "./user";
import { Base } from "./base";

export interface AccountImport extends Base {
    username: string;
    jwtToken: string;
  }

  export class AccountImportHelper{
    static getForAdd(user: BaseUser, account: AccountImport): AccountImport {
      return {
        ...this.getForUpdate(user, account),
        dateCreated: Timestamp.fromDate(new Date()),
        createdByUser: user,
      } as AccountImport;
    }
  
    static getForUpdate(user: BaseUser, data: AccountImport): Partial<AccountImport> {
          return {
            name: data.name ?? "",
            nameLowered: data.name?.toLocaleLowerCase() ?? "",
            username: data.username ?? "",
            lastEdit: Timestamp.fromDate(new Date()),
            lastUpdatedByUser: user,
            jwtToken: data.jwtToken ?? "",
          };
        }
  }