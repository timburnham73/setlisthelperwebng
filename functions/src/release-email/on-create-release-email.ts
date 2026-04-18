import { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

interface ReleaseEmailRequest {
  subject: string;
  version: string;
  platform: string; // "iOS", "Android", "Both"
  releaseNotes: string; // HTML content for the release notes section
  status: string;
  sentCount?: number;
  failedCount?: number;
  createdAt?: admin.firestore.Timestamp;
}

export default async function handler(
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>,
  smtpHost: string,
  smtpPort: string,
  smtpUser: string,
  smtpPass: string,
) {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const data = snapshot.data() as ReleaseEmailRequest;

  if (data.status !== "pending") {
    console.log(`Release email ${snapshot.id} status is "${data.status}", skipping`);
    return;
  }

  await snapshot.ref.update({ status: "sending" });

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Get all users with email addresses
  const usersSnapshot = await admin.firestore().collection("users").get();
  const users = usersSnapshot.docs
    .map(doc => doc.data())
    .filter(u => u.email);

  let sentCount = 0;
  let failedCount = 0;

  for (const user of users) {
    const greeting = user.displayName ?
      `Hi ${user.displayName},` :
      "Hi,";

    const emailHtml = buildEmailHtml(
      greeting,
      data.version,
      data.platform,
      data.releaseNotes,
    );

    const emailText = buildEmailText(
      greeting,
      data.version,
      data.platform,
      data.releaseNotes,
    );

    try {
      await transporter.sendMail({
        from: `"Band Central" <${smtpUser}>`,
        to: user.email,
        replyTo: "support@bandcentral.com",
        subject: data.subject || `Band Central ${data.version} is here!`,
        html: emailHtml,
        text: emailText,
      });
      sentCount++;
    } catch (error) {
      console.error(`Failed to send release email to ${user.email}:`, error);
      failedCount++;
    }
  }

  await snapshot.ref.update({
    status: "sent",
    sentCount,
    failedCount,
  });

  console.log(
    `Release email ${snapshot.id}: sent=${sentCount}, failed=${failedCount}`,
  );
}

function buildEmailHtml(
  greeting: string,
  version: string,
  platform: string,
  releaseNotes: string,
): string {
  const appStoreLink = "https://apps.apple.com/app/id6758914812";
  const playStoreLink =
    "https://play.google.com/store/apps/details?id=com.app.bandcentral";

  let storeButtons = "";
  if (platform === "iOS" || platform === "Both") {
    storeButtons += `<a href="${appStoreLink}" style="display:inline-block;margin-right:12px;padding:10px 20px;background-color:#0A66C2;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Update on App Store</a>`;
  }
  if (platform === "Android" || platform === "Both") {
    storeButtons += `<a href="${playStoreLink}" style="display:inline-block;padding:10px 20px;background-color:#0A66C2;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Update on Google Play</a>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#0A66C2;font-size:24px;margin:0;">Band Central ${version}</h1>
        <p style="color:#666;font-size:14px;margin:4px 0 0;">${platform} Release</p>
      </div>

      <!-- Greeting -->
      <p style="font-size:16px;color:#333;line-height:1.6;">${greeting}</p>
      <p style="font-size:16px;color:#333;line-height:1.6;">We just released a new version of Band Central. Here's what's new:</p>

      <!-- Release Notes -->
      <div style="background:#f8f9fa;border-left:4px solid #0A66C2;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
        ${releaseNotes}
      </div>

      <!-- Store Buttons -->
      <div style="text-align:center;margin:28px 0;">
        ${storeButtons}
      </div>

      <div style="text-align:center;margin:20px 0;">
        <a href="https://www.bandcentral.com" style="color:#0A66C2;text-decoration:none;font-size:14px;">Visit bandcentral.com</a>
      </div>

      <!-- Signature -->
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eee;">
        <p style="font-size:16px;color:#333;line-height:1.6;margin:0;">Cheers,</p>
        <p style="font-size:16px;color:#333;line-height:1.6;margin:4px 0 0;font-weight:600;">Tim</p>
        <p style="font-size:14px;color:#666;margin:4px 0 0;">Founder, Band Central</p>
        <p style="font-size:14px;margin:4px 0 0;"><a href="https://www.bandcentral.com" style="color:#0A66C2;text-decoration:none;">www.bandcentral.com</a></p>
      </div>

      <!-- AirTurn Affiliate -->
      <div style="margin-top:24px;padding:16px;background:#f0f7ff;border-radius:8px;text-align:center;">
        <p style="font-size:13px;color:#555;margin:0 0 8px;">Upgrade your live performance with hands-free page turning</p>
        <a href="https://www.airturn.com/?ref=bandcentral" style="color:#0A66C2;font-weight:600;text-decoration:none;font-size:14px;">Shop AirTurn Bluetooth Pedals →</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px 0;">
      <p style="font-size:12px;color:#999;margin:0;">You're receiving this because you have a Band Central account.</p>
      <p style="font-size:12px;color:#999;margin:4px 0 0;">© ${new Date().getFullYear()} Band Central</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(
  greeting: string,
  version: string,
  platform: string,
  releaseNotes: string,
): string {
  const plainNotes = releaseNotes
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  return `${greeting}

We just released Band Central ${version} for ${platform}. Here's what's new:

${plainNotes}

Update your app:
- App Store: https://apps.apple.com/app/id6758914812
- Google Play: https://play.google.com/store/apps/details?id=com.app.bandcentral
- Web: https://www.bandcentral.com

---

Upgrade your live performance with hands-free page turning:
https://www.airturn.com/?ref=bandcentral

Cheers,
Tim
Founder, Band Central
www.bandcentral.com`;
}
