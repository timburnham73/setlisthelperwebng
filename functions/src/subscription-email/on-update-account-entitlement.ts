import { FirestoreEvent, Change, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";
import { Account } from "../model/account";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  "solo": "Solo",
  "solo-free-trial": "Solo (Free Trial)",
  "band-small": "Band Small",
  "band-small-free-trial": "Band Small (Free Trial)",
  "band-medium": "Band Medium",
  "band-medium-free-trial": "Band Medium (Free Trial)",
  "band-large": "Band Large",
  "band-large-free-trial": "Band Large (Free Trial)",
  "band-extra-large": "Band Extra Large",
  "band-extra-large-free-trial": "Band Extra Large (Free Trial)",
};

function isFreeTier(level: string | undefined): boolean {
  return !level || level === "free";
}

function isFreeTrial(level: string | undefined): boolean {
  return !!level && level.endsWith("-free-trial");
}

export default async function handler(
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>,
  smtpHost: string,
  smtpPort: string,
  smtpUser: string,
  smtpPass: string,
) {
  if (!event.data) {
    console.log("No data associated with the event");
    return;
  }

  const before = event.data.before.data() as Account;
  const after = event.data.after.data() as Account;

  const previousLevel = before.entitlementLevel;
  const newLevel = after.entitlementLevel;

  // Only send email when entitlement changes from free to a paid/trial tier
  if (!isFreeTier(previousLevel) || isFreeTier(newLevel)) {
    return;
  }

  const ownerEmail = after.ownerUser?.email;
  const ownerName = after.ownerUser?.displayName;
  const bandName = after.name;

  if (!ownerEmail) {
    console.log("No owner email found on account, skipping subscription email");
    return;
  }

  const planName = PLAN_DISPLAY_NAMES[newLevel ?? ""] ?? newLevel;

  let emailBody: string;

  if (isFreeTrial(newLevel)) {
    emailBody = `${ownerName ? `Hi ${ownerName},` : "Hi,"}

Thank you for starting your free trial of Band Central${bandName ? ` for ${bandName}` : ""}! You now have access to the ${planName} plan.

During your trial, you'll have full access to all the features in your plan including unlimited songs, setlists, and collaboration with your band members. Take some time to explore everything Band Central has to offer.

If you have any questions or need help getting started, don't hesitate to reach out. I'm here to help.

Cheers,

Tim
www.bandcentral.com`;
  } else {
    emailBody = `${ownerName ? `Hi ${ownerName},` : "Hi,"}

Thank you for subscribing to Band Central${bandName ? ` for ${bandName}` : ""}! You are now on the ${planName} plan.

Your subscription gives you and your band full access to real-time sync, per-member lyrics, collaboration tools, and much more. If you haven't already, invite your band members so they can start using Band Central too.

As always, your feedback is incredibly valuable. If you have suggestions or run into any issues, please reach out.

Cheers,

Tim
www.bandcentral.com`;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Band Central" <${smtpUser}>`,
      to: ownerEmail,
      replyTo: "support@bandcentral.com",
      subject: isFreeTrial(newLevel)
        ? "Welcome to Your Band Central Free Trial"
        : "Thank You for Subscribing to Band Central",
      text: emailBody,
    });

    console.log(`Subscription email sent to ${ownerEmail} (${previousLevel} -> ${newLevel})`);
  } catch (error) {
    console.error("Error sending subscription email:", error);
  }
}
