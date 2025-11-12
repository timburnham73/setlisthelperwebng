import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { Timestamp } from "@angular/fire/firestore";

export interface Artist extends Base {
  countOfSongs: number;
}