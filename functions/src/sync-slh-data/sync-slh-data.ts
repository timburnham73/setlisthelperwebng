import * as functions from "firebase-functions";
import {db} from "../init";
import {AccountImport} from "../model/account-import";
import {SLHSong, SLHSongHelper, SongType} from "../model/SLHSong";
import {Lyric, LyricHelper} from "../model/lyric";
import {BaseUser} from "../model/user";
import {AccountImportEvent} from "../model/account-import-event";
import {Timestamp} from "firebase-admin/firestore";
import {SLHSetlist, SLHSetlistHelper} from "../model/SLHSetlist";
import {SetlistBreakHelper} from "../model/setlist-break";
import {SetlistSong} from "../model/setlist-song";
import {SLHTag, SLHTagHelper} from "../model/SLHTag";
import {countSongs, countTags} from "../utils";
import {Song} from "../model/song";
import {countSetlists} from "../setlists-trigger/setlist-util";
import {Artist, ArtistHelper} from "../model/artist";
import {Genre, GenreHelper} from "../model/genre";
import {SetlistSongRef} from "../model/setlist";

interface SlhSongToFirebaseSongId {
  SongId: number;
  FireBaseSongId: string;
}

interface SlhSongIdToTagName {
  SLHSongId: number;
  TagName: string;
}

interface SlhSongIdToSetlists {
  SLHSongId: number;
  setlists: SetlistSongRef[];
}

// Entry point
export default async (accountImportSnap, context) => {
  const accountImport = accountImportSnap.data() as AccountImport;
  const accountId = context.params.accountId;
  functions.logger.debug(`Account jwtToken ${accountImport.jwtToken}`);

  const accountRef = db.doc(`/accounts/${accountId}`);

  await accountRef.update({slhImportInProgress: true});

  await startSync(accountImport.jwtToken, accountId, accountImportSnap.id, accountImport.createdByUser);

  await countSongs(accountId);

  await countTags(accountId);

  await countSetlists(accountId);

  await accountRef.update({slhImportInProgress: false});
};

// Starting to Sync
export const startSync = async (jwtToken: string, accountId: string, accountImportId: string, importingUser: BaseUser) => {
  const songsRef = db.collection(`/accounts/${accountId}/songs`);
  const tagsRef = db.collection(`/accounts/${accountId}/tags`);
  const artistsRef = db.collection(`/accounts/${accountId}/artists`);
  const genresRef = db.collection(`/accounts/${accountId}/genres`);
  const accountImportEventRef = db.collection(`/accounts/${accountId}/imports/${accountImportId}/events`);

  await addAccountEvent("System", "Starting import.", accountImportEventRef);

  // Tags
  await addAccountEvent("Tags", "Downloading tags.", accountImportEventRef);
  const tagDetails: string[] = [];

  const slhSetlists = await getSetlists(jwtToken);

  const slhTags: SLHTag[] = await getTags(jwtToken);
  const mapSLHSongIdToTagName: SlhSongIdToTagName[] = [];
  for (const slhTag of slhTags) {
    if (!slhTag.Name) {
      continue;// Do not add a tag with no name.
    }

    // TAG: Add the tag to the database
    const convertedTag = SLHTagHelper.slhTagToTag(slhTag, importingUser);
    const alreadyAddedTag = mapSLHSongIdToTagName.find((tagName) => tagName.TagName.toLowerCase() === convertedTag.name.toLowerCase());
    if (!alreadyAddedTag) {
      convertedTag.countOfSongs = slhTag.songs.length;
      await tagsRef.doc().set(convertedTag);
      tagDetails.push(`Adding tag with name ${convertedTag.name}`);
    }

    // TAG: Create the mapping to the slh song id.
    for (const songId of slhTag.songs) {
      // If there was a duplicate tag name add the tag name that was already added first.
      const tagName = alreadyAddedTag?.TagName? alreadyAddedTag?.TagName: slhTag.Name;
      mapSLHSongIdToTagName.push({SLHSongId: songId, TagName: tagName});
    }
  }

  const songDetails: string[] = [];// Account device details when the songs finish processing
  await addAccountEvent("Songs", "Downloading songs and lyrics.", accountImportEventRef);
  const slhSongs: SLHSong[] = await getSongs(jwtToken);

  const accountRef = db.doc(`/accounts/${accountId}`);
  await accountRef.update({slhImportInProgress: true});

  await addAccountEvent("Setlists", "Downloading setlists.", accountImportEventRef);
  const setlistsRef = db.collection(`/accounts/${accountId}/setlists`);

  const setlistDetails: string[] = [];
  const mapSLHSongIdToSetlists: SlhSongIdToSetlists[] = [];
  const setlistContext: { slhSetlist: SLHSetlist; setlistId: string; precreatedSongRefs: { index: number; docRef: any }[] }[] = [];

  await addAccountEvent("Setlists", "Processing setlists.", accountImportEventRef);
  for (const slhSetlist of slhSetlists) {
    const convertedSetlist = SLHSetlistHelper.slhSetlistToSetlist(slhSetlist, importingUser);

    const addedSetlist = setlistsRef.doc();
    await addedSetlist.set(convertedSetlist);

    setlistDetails.push(`Added setlist with name ${convertedSetlist.name}`);
    const precreatedSongRefs: { index: number; docRef: any }[] = [];

    const setlistSongsRef = db.collection(`/accounts/${accountId}/setlists/${addedSetlist.id}/songs`);
    for (let index = 0; index < slhSetlist.songs.length; index++) {
      const setlistSongId = slhSetlist.songs[index];
      const setlistSLHSong = slhSongs.find((slhSong) => slhSong.SongId === setlistSongId);
      if (setlistSLHSong && setlistSLHSong.SongType === SongType.Song) {
        // Pre-create the SetlistSong doc ref so we can use its id in Song.setlists
        const setlistSongDocRef = setlistSongsRef.doc();
        precreatedSongRefs.push({index, docRef: setlistSongDocRef});

        const setlistSongRefForSong: SetlistSongRef = {
          id: addedSetlist.id,
          name: convertedSetlist.name,
          setlistSongId: setlistSongDocRef.id,
        };

        let mapEntry = mapSLHSongIdToSetlists.find((m) => m.SLHSongId === setlistSLHSong.SongId);
        if (!mapEntry) {
          mapEntry = {SLHSongId: setlistSLHSong.SongId, setlists: []};
          mapSLHSongIdToSetlists.push(mapEntry);
        }
        mapEntry.setlists.push(setlistSongRefForSong);
      }
    }

    setlistContext.push({slhSetlist, setlistId: addedSetlist.id, precreatedSongRefs});
  }

  await addAccountEvent("Songs", "Processing Songs, Lyrics, and Tags.", accountImportEventRef);
  const mapSongIdToFirebaseSongId: SlhSongToFirebaseSongId[] = [];
  const artists: Artist[] = [];
  const genres: Genre[] = [];
  for (const slhSong of slhSongs) {
    if (slhSong.SongType === 1) {
      songDetails.push(`Not Adding song with name ${slhSong.Name}`);
      continue;
    }

    const convertedSong = SLHSongHelper.slhSongToSong(slhSong, importingUser);

    const slhSongToTagNames = mapSLHSongIdToTagName.filter((slhSongIdToTagName) => slhSongIdToTagName.SLHSongId === slhSong.SongId);
    if (slhSongToTagNames.length > 0) {
      const tagNames = slhSongToTagNames.map((slhSongIdToTagName) => slhSongIdToTagName.TagName);
      convertedSong.tags = tagNames;
      songDetails.push(`Added tags to Song ${convertedSong.name}: ${tagNames.join(",")}`);
    }

    const slhSongSetlists = mapSLHSongIdToSetlists.find((m) => m.SLHSongId === slhSong.SongId);
    if (slhSongSetlists) {
      convertedSong.setlists = slhSongSetlists.setlists;
    }

    if (convertedSong.artist) {
      const foundArtist = artists.find((artist) => artist.nameLowered === convertedSong.artist.toLocaleLowerCase());
      if (!foundArtist) {
        artists.push(ArtistHelper.getForAdd({name: convertedSong.artist, nameLowered: convertedSong.artist.toLowerCase(), countOfSongs: 1}, importingUser));
      } else {
        foundArtist.countOfSongs++;
      }
    }

    if (convertedSong.genre) {
      const foundGenre = genres.find((genre) => genre.nameLowered === convertedSong.genre.toLocaleLowerCase());
      if (!foundGenre) {
        genres.push(GenreHelper.getForAdd({name: convertedSong.genre, nameLowered: convertedSong.genre.toLowerCase(), countOfSongs: 1}, importingUser));
      } else {
        foundGenre.countOfSongs++;
      }
    }

    const docRef = await songsRef.doc();
    await docRef.set(convertedSong);

    mapSongIdToFirebaseSongId.push({SongId: slhSong.SongId, FireBaseSongId: docRef.id});

    await addLyrics(slhSong, accountId, docRef.id, convertedSong, importingUser, songDetails);
  }

  await addAccountEventWithDetails("Song", "Finished processing songs.", [...tagDetails, ...songDetails], accountImportEventRef);

  for (const artist of artists) {
    const docRef = await artistsRef.doc();
    await docRef.set(artist);
  }

  for (const genre of genres) {
    const docRef = await genresRef.doc();
    await docRef.set(genre);
  }

  for (const context of setlistContext) {
    const setlistSongsRef = db.collection(`/accounts/${accountId}/setlists/${context.setlistId}/songs`);

    let sequenceNumber = 1;
    for (let index = 0; index < context.slhSetlist.songs.length; index++) {
      const setlistSongId = context.slhSetlist.songs[index];
      const setlistSLHSong = slhSongs.find((slhSong) => slhSong.SongId === setlistSongId);
      if (setlistSLHSong) {
        const convertedSong = SLHSongHelper.slhSongToSong(setlistSLHSong, importingUser);
        if (setlistSLHSong.SongType === 1) {
          const setBreakPartial = {
            sequenceNumber: sequenceNumber,
            isBreak: true,
            name: convertedSong.name,
            notes: convertedSong.notes,
            breakTime: convertedSong.songLength,
          };

          const setBreak = SetlistBreakHelper.getSetlistBreakForAdd(setBreakPartial, importingUser);
          await setlistSongsRef.doc().set(setBreak);

          setlistDetails.push(`Added setlist break with name ${setBreak.name}`);
        } else {
          const songIdMap = mapSongIdToFirebaseSongId.find((slhSongMap) => slhSongMap.SongId === setlistSongId);
          const setlistSong = {
            sequenceNumber: sequenceNumber,
            isBreak: false,
            updateOnlyThisSetlistSong: false,
            songId: songIdMap ? songIdMap.FireBaseSongId : "",
            ...convertedSong,
          } as SetlistSong;

          const precreated = context.precreatedSongRefs.find((p) => p.index === index);
          const setlistSongDocRef = precreated ? precreated.docRef : setlistSongsRef.doc();
          await setlistSongDocRef.set(setlistSong);
          setlistDetails.push(`Added setlist song with name ${setlistSong.name}`);
        }
        sequenceNumber++;
      }
    }
  }

  await addAccountEventWithDetails("Setlists", "Finished processing setlists.", setlistDetails, accountImportEventRef);

  functions.logger.debug("Finished importing data");

  await addAccountEvent("System", "Finished importing data.", accountImportEventRef);
};

async function addLyrics(slhSong: SLHSong, accountId: string, songId: string, convertedSong: Song, importingUser: BaseUser, songDetails: string[]) {
  if (slhSong.SongType === SongType.Song) {
    // Needed to updat the song with the default lyric
    const songUpdateRef = db.collection(`/accounts/${accountId}/songs`);
    const lyricsRef = db.collection(`/accounts/${accountId}/songs/${songId}/lyrics`);

    let versionNumber = 1;
    let documentLyricCreated = false;
    if (slhSong.DocumentLocation) {
      const lyricName = `Version ${versionNumber++}`;
      const lyricDocument = {
        name: lyricName,
        key: convertedSong.key,
        tempo: convertedSong.tempo,
        notes: "",
        noteValue: convertedSong.noteValue,
        beatValue: convertedSong.beatValue,
        youTubeUrl: convertedSong.youTubeUrl,
        songId: songId,
        lyrics: "",
        audioLocation: slhSong.IosAudioLocation ? slhSong.IosAudioLocation : slhSong.SongLocation,
      } as Partial<Lyric>;

      const addedLyricRef = lyricsRef.doc();
      await addedLyricRef.set(LyricHelper.getForAdd(lyricDocument, importingUser));

      convertedSong.defaultLyricForUser.push({uid: importingUser.uid, lyricId: addedLyricRef.id});
      await songUpdateRef.doc(songId).update(convertedSong);

      songDetails.push(`Adding ${lyricName} lyrics for song with name ${slhSong.Name}`);
      documentLyricCreated = true;
    }

    if (slhSong.Lyrics) {
      const lyricName = `Version ${versionNumber}`;
      const lyric = {
        name: lyricName,
        key: convertedSong.key,
        tempo: convertedSong.tempo,
        notes: "",
        noteValue: convertedSong.noteValue,
        beatValue: convertedSong.beatValue,
        youTubeUrl: convertedSong.youTubeUrl,
        songId: songId,
        lyrics: slhSong.Lyrics,
        transpose: slhSong.Transpose,
        audioLocation: slhSong.IosAudioLocation ? slhSong.IosAudioLocation : slhSong.SongLocation,
      } as Partial<Lyric>;

      const addedLyricRef = lyricsRef.doc();
      await addedLyricRef.set(LyricHelper.getForAdd(lyric, importingUser));
      songDetails.push(`Adding ${lyricName} lyrics for song with name ${slhSong.Name}`);

      if (documentLyricCreated == false) {
        convertedSong.defaultLyricForUser.push({uid: importingUser.uid, lyricId: addedLyricRef.id});
        await songUpdateRef.doc(songId).update(convertedSong);
      }
    }
  }
}

async function addAccountEventWithDetails(eventType: string, message: string, details: string[], accountImportEventRef) {
  const accountImportEvent = await accountImportEventRef.add({
    eventType: eventType,
    message: message,
    eventTime: Timestamp.now(),
  } as AccountImportEvent);

  const accountImportEventDetailsRef = db.collection(accountImportEvent.path + "/details");
  accountImportEventDetailsRef.add({details: details});
}

async function addAccountEvent(eventType: string, message: string, accountImportEventRef) {
  await accountImportEventRef.add({
    eventType: eventType,
    message: message,
    eventTime: Timestamp.now(),
  } as AccountImportEvent);
}
async function getSongs(accessToken: string) {
  const actionUrl = "https://setlisthelper.azurewebsites.net/api/v2.0/Song";
  const jwt = accessToken;
  const songsUrl = actionUrl;

  const headers: Headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", "Bearer " + jwt);

  const request: RequestInfo = new Request(songsUrl, {
    method: "GET",
    headers: headers,
  });

  const response = await fetch(request);
  const data = await response.json();
  return data as SLHSong[];
}

async function getSetlists(accessToken: string) {
  const actionUrl = "https://setlisthelper.azurewebsites.net/api/v2.0/Setlist";
  const jwt = accessToken;
  const songsUrl = actionUrl;

  const headers: Headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", "Bearer " + jwt,);

  const request: RequestInfo = new Request(songsUrl, {
    // We need to set the `method` to `POST` and assign the headers
    method: "GET",
    headers: headers,
  });

  // Send the request and print the response
  const response = await fetch(request);
  const data = await response.json();
  return data as SLHSetlist[];
}

async function getTags(accessToken: string) {
  const actionUrl = "https://setlisthelper.azurewebsites.net/api/v2.0/Tag";
  const jwt = accessToken;
  const songsUrl = actionUrl;

  const headers: Headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", "Bearer " + jwt,);

  const request: RequestInfo = new Request(songsUrl, {
    // We need to set the `method` to `POST` and assign the headers
    method: "GET",
    headers: headers,
  });

  // Send the request and print the response
  const response = await fetch(request);
  const data = await response.json();
  return data as SLHTag[];
}
