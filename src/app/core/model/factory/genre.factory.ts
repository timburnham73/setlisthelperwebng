import { BaseUser } from "../user";
import { BaseFactory } from "./base.factory";
import { Genre } from "../genre";

export class GenreFactory extends BaseFactory<Genre> {
  constructor(user: BaseUser) {
    super(user);
  }
  
  override getForAdd(data: Partial<Genre>): Genre {
    return {
      ...super.getForAdd(data),
      countOfSongs: data.countOfSongs ?? 0,
    } as Genre;
  }

  override getForUpdate(data: Partial<Genre>): Partial<Genre> {
    return {
      ...super.getForUpdate(data),
      countOfSongs: data.countOfSongs ?? 0,
    };
  }
}