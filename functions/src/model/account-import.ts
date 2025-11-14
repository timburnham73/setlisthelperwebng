import { Timestamp } from "@angular/fire/firestore";
import { BaseUser } from "./user";
import { Base } from "./base";

export interface AccountImport extends Base {
    username: string;
    jwtToken: string;
    importLog : [];
    isFinished: boolean;
    
  }

  export class AccountImportHelper{
    static getForAdd(user: BaseUser, account: AccountImport): AccountImport {
      const accountForAdd = this.getForUpdate(user, account);
      accountForAdd.dateCreated = Timestamp.fromDate(new Date());
      accountForAdd.createdByUser = user;
      return accountForAdd;
    }
  
    static getForUpdate(user: BaseUser, data: AccountImport): AccountImport {
          return {
            name: data.username ?? "",
            nameLowered: (data.username ?? "").toLowerCase(),
            username: data.username ?? "",
            createdByUser: data.createdByUser ?? "",
            dateCreated: data.dateCreated ?? Timestamp.fromDate(new Date()),
            lastEdit: Timestamp.fromDate(new Date()),
            lastUpdatedByUser: user,
            jwtToken: data.jwtToken ?? "",
            importLog: data.importLog ?? [],
            isFinished: data.isFinished ?? false
          };
        }
  }