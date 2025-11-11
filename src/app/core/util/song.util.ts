import { Song } from '../model/song';

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

  if (song.songLength) {
    songDetails.push(getSongLength(song));
  }

  return songDetails.join(' - ');
}
