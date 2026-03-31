import { Song } from '../model/song';

/**
 * Computes lengthMin and lengthSec from songLength (total seconds).
 * Firestore stores songLength but not the derived min/sec fields.
 */
export function hydrateSongLength<T extends { songLength?: number; lengthMin?: number; lengthSec?: number }>(song: T): T {
  if (song.songLength && !song.lengthMin) {
    song.lengthMin = Math.floor(song.songLength / 60);
    song.lengthSec = song.songLength % 60;
  }
  return song;
}

export function getSongLength(song: Song): string {
  return song.lengthMin ? song.lengthMin + ':' + (song.lengthSec ?? 0).toString().padStart(2, '0') : '';
}

export function getSongDetails(song: any): string {
  const songDetails: string[] = [];

  if (song.isBreak) {
    if (song.notes) {
      songDetails.push(song.notes);
    }
  } else {
    if (song.artist) {
      songDetails.push(song.artist);
    }
    if (song.genre) {
      songDetails.push(song.genre);
    }
    if (song.key) {
      songDetails.push(song.key);
    }
    if (song.tempo) {
      songDetails.push(song.tempo);
    }
  }

  const length = song.songLength ? getSongLength(song) : '';
  if (length) {
    songDetails.push(length);
  }

  return songDetails.join(' - ');
}
