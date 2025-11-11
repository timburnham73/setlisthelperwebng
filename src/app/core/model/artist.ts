import { Base } from "./base";
import { BaseUser, UserHelper } from "./user";
import { Timestamp } from "@angular/fire/firestore";

export interface Artist extends Base {
  countOfSongs: number;
}

export class ArtistHelper{
  static getForAdd(user: BaseUser, artist: Artist): Artist {
    const artistForAdd = this.getForUpdate(user, artist);
    artistForAdd.dateCreated = Timestamp.fromDate(new Date());
    artistForAdd.createdByUser = user;

    return artistForAdd;
  }

  static getForUpdate(user: BaseUser, data: Artist): Artist {
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