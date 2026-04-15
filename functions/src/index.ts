/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 *
 * The exported function name has the format of {Model}_{Event}_{Function Name}
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

// Initialize firebase-admin at startup for Storage access
if (!admin.apps.length) {
  admin.initializeApp();
}

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
// Contact Request functions
const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

// eslint-disable-next-line camelcase
export const ContactRequest_OnCreate_SendEmail =
  onDocumentCreated(
    {
      document: "contactRequests/{contactRequestId}",
      secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS],
    },
    async event => {
      await (
        await import("./contact-request/on-create-contact-request"))
        .default(
          event,
          SMTP_HOST.value(),
          SMTP_PORT.value(),
          SMTP_USER.value(),
          SMTP_PASS.value(),
        );
    });

// ////////////////////////////////
// Welcome Email functions
// eslint-disable-next-line camelcase
export const WelcomeEmail_OnCreate_SendEmail =
  onDocumentCreated(
    {
      document: "welcomeEmails/{welcomeEmailId}",
      secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS],
    },
    async event => {
      await (
        await import("./welcome-email/on-create-welcome-email"))
        .default(
          event,
          SMTP_HOST.value(),
          SMTP_PORT.value(),
          SMTP_USER.value(),
          SMTP_PASS.value(),
        );
    });

// ////////////////////////////////
// Subscription Email functions (entitlement change: free -> paid/trial)
// eslint-disable-next-line camelcase
export const Account_OnUpdate_SendSubscriptionEmail =
  onDocumentUpdated(
    {
      document: "accounts/{accountId}",
      secrets: [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS],
    },
    async event => {
      await (
        await import("./subscription-email/on-update-account-entitlement"))
        .default(
          event,
          SMTP_HOST.value(),
          SMTP_PORT.value(),
          SMTP_USER.value(),
          SMTP_PASS.value(),
        );
    });

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
