import { FirestoreEvent, Change, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

/**
 * When a user updates their displayName (via the Profile dialog),
 * cascade the new value to every account where this user is the owner.
 *
 * Why only ownerUser and not createdByUser / lastUpdatedByUser:
 *   - ownerUser semantically means "current owner" — must be live.
 *   - createdByUser / lastUpdatedByUser are audit fields — snapshot-at-time
 *     is the correct semantics ("at the time of this edit, the user was
 *     called X"). Stale is correct, so we don't fan out to those.
 *
 * Most users own 1-3 bands, so this is a small batch.
 */
export default async function handler(
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { uid: string }>,
) {
  if (!event.data) {
    console.log("No data associated with the user update event");
    return;
  }

  const uid = event.params.uid;
  const before = event.data.before.data();
  const after = event.data.after.data();

  const oldName = before?.displayName;
  const newName = after?.displayName;

  if (!newName || newName === oldName) {
    return;
  }

  const db = admin.firestore();
  const accountsSnap = await db
    .collection("accounts")
    .where("ownerUser.uid", "==", uid)
    .get();

  if (accountsSnap.empty) {
    console.log(`No accounts owned by ${uid}; nothing to sync`);
    return;
  }

  const batch = db.batch();
  for (const doc of accountsSnap.docs) {
    batch.update(doc.ref, {
      "ownerUser.displayName": newName,
    });
  }
  await batch.commit();

  console.log(
    `Synced ownerUser.displayName="${newName}" to ${accountsSnap.size} account(s) for user ${uid}`,
  );
}
