import { BaseUser } from '../user';
import { Song } from '../song';
import { SongFactory } from './song.factory';
import { SetlistSong } from '../setlist-song';

export class SetlistSongFactory {
  private songFactory: SongFactory;

  constructor(user: BaseUser) {
    this.songFactory = new SongFactory(user);
  }

  getForUpdate(setlistSong: SetlistSong): SetlistSong {
    return {
      ...this.songFactory.getForUpdate(setlistSong),
      sequenceNumber: setlistSong.sequenceNumber ?? 1,
      songId: setlistSong.songId ?? '',
      isBreak: setlistSong.isBreak ?? false,
      updateOnlyThisSetlistSong: setlistSong.updateOnlyThisSetlistSong ?? false,
    } as SetlistSong;
  }

  // Merge Song fields into an existing SetlistSong. Preserve setlist-specific fields and id.
  getForUpdateFromSong(existing: SetlistSong, song: Song): SetlistSong {
    const normalizedSong = this.songFactory.getForUpdate(song);
    const merged: SetlistSong = {
      ...existing,
      ...normalizedSong,
      // Preserve setlist-specific fields and id from existing
      id: existing.id,
      sequenceNumber: existing.sequenceNumber,
      songId: existing.songId,
      isBreak: existing.isBreak,
      updateOnlyThisSetlistSong: existing.updateOnlyThisSetlistSong,
    } as SetlistSong;
    return merged;
  }

  getSongFromSetlistSong(setlistSong: SetlistSong): Song {
    const { sequenceNumber, songId, isBreak, updateOnlyThisSetlistSong, ...songLike } = setlistSong;
    const songForReturn: Song = {
      ...(songLike as Song),
      id: songId,
    };
    return songForReturn;
  }
}
