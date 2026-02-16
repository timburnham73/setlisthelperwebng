/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 *
 * The exported function name has the format of {Model}_{Event}_{Function Name}
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";

// ////////////////////////////////////////////////
// Lyrics
/* export const Lyrics_OnAdd_UpdateSongLyricsCount =
  onDocumentCreated("accounts/{accountId}/songs/{songId}/lyrics/{lyricId}",
    async (event) => {
      await (
        await import("./lyrics-count-trigger/on-add-lyrics"))
        .default(event);
    });

//////////////////////////////////////////////////
//Setlist Songs
export const SetlistSong_OnAdd_UpdateSetlistSongStatistics =
  onDocumentCreated("accounts/{accountId}/setlists/{setlistId}/songs/{setlistSongId}",
    async (event) => {
      await (
        await import("./setlist-song-trigger/on-add-setlist-song"))
        .default(event);
    });

//////////////////////////////////
//Song functions
export const Song_onAdd_UpdateSetlistCount =
  onDocumentCreated("accounts/{accountId}/songs/{songId}",
    async (event) => {
      await (
        await import("./songs-trigger/on-add-song"))
        .default(event);
    });

//////////////////////////////////
//Setlist functions
export const Setlist_onAdd_UpdateSetlistCount =
  onDocumentCreated("accounts/{accountId}/setlists/{setlistId}",
    async (event) => {
      await (
        await import("./setlists-trigger/on-count-setlists"))
        .default(event);
    });
*/

// ////////////////////////////////
// Sync functions
export const accoutImportOnAddStartSLHSync =
  onDocumentCreated(
    {
      document: "accounts/{accountId}/imports/{importId}",
      timeoutSeconds: 540,
      memory: "512MiB",
    },
    async event => {
      // Dynamically import this function to reduce start up times.
      // When cloud functions are spun up all exported functions in the file will be loaded.
      // If all the code was below every function would load.
      await (
        await import("./sync-slh-data/sync-slh-data"))
        .default(event);
    });
