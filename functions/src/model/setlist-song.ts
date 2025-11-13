
import {Song} from './song';

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