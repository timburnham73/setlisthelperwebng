import { BaseUser } from "../user";
import { BaseFactory } from "./base.factory";
import { Artist } from "../artist";

export class ArtistFactory extends BaseFactory<Artist> {
  constructor(user: BaseUser) {
    super(user);
  }
  
  override getForAdd(data: Partial<Artist>): Artist {
    return {
      ...super.getForAdd(data),
      countOfSongs: data.countOfSongs ?? 0,
    } as Artist;
  }

  override getForUpdate(data: Partial<Artist>): Partial<Artist> {
    return {
      ...super.getForUpdate(data),
      countOfSongs: data.countOfSongs ?? 0,
    };
  }
}