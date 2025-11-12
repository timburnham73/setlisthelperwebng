
import { Song } from './song';
import { SongFactory } from './factory/song.factory';
import { BaseUser } from './user';

export interface SetlistSong extends Song {
   sequenceNumber: number;
   songId: string;
   isBreak: boolean;
   //When you save a SetlistSong you have the option to save to the master song in the repertorie. 
   //This value is important because when you save the source it will find all the other seltist songs
   //in other setlist and update them also. If the other songs do not have this set to true it will not
   //update them
   updateOnlyThisSetlistSong: boolean; 
}

export class SetlistSongHelper{
   static getForUpdate(setlistSong: SetlistSong, userUpdating: BaseUser): SetlistSong {
       return {
         sequenceNumber: setlistSong.sequenceNumber ?? 1,
          songId: setlistSong.songId ?? "",
          isBreak: setlistSong.isBreak ?? false,
          updateOnlyThisSetlistSong: setlistSong.updateOnlyThisSetlistSong ?? false, 
          ...new SongFactory(userUpdating).getForUpdate(setlistSong)
       };
     }

   static getSongFromSetlistSong(setlistSong: SetlistSong){
      let songForReturn: Song = {...setlistSong};
      songForReturn.id = setlistSong.songId;
      return songForReturn;
   }
 }