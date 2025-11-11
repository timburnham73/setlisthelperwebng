import { Timestamp } from "@angular/fire/firestore";
import { Base } from "../base";
import { BaseUser } from "../user";

export abstract class BaseFactory<T extends Base> {
  protected user: BaseUser;

  constructor(user: BaseUser) {
    this.user = user;
  }

  getForAdd(data: Partial<T>): T {
    return {
      ...this.getForUpdate(data),
      dateCreated: Timestamp.fromDate(new Date()),
      createdByUser: this.user,
    } as T;
  }

  getForUpdate(data: Partial<T>): Partial<T> {
    return {
      ...data, // Keep existing data
      name: data.name ?? "",
      nameLowered: data.name?.toLocaleLowerCase() ?? "",
      lastEdit: Timestamp.fromDate(new Date()),
      lastUpdatedByUser: this.user,
    };
  }
}

