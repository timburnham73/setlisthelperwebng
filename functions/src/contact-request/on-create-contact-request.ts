import { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

interface ContactRequest {
  supportType: "billing" | "technical";
  platform: "ios" | "android" | "web";
  name: string;
  email: string;
  subject: string;
  appVersion: string | null;
  deviceInfo: string | null;
  bandName: string | null;
  description: string;
  screenshotUrl: string | null;
  status: string;
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

  const data = snapshot.data() as ContactRequest;

  const typeLabel = data.supportType === "billing" ?
    "Purchase/Billing Support" :
    "Technical Support";

  const lines: string[] = [
    `Support Type: ${typeLabel}`,
    `Platform: ${data.platform.toUpperCase()}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    "",
  ];

  if (data.appVersion) {
    lines.push(`App Version: ${data.appVersion}`);
  }
  if (data.deviceInfo) {
    lines.push(`Device Info / OS Version: ${data.deviceInfo}`);
  }
  if (data.bandName) {
    lines.push(`Band Name: ${data.bandName}`);
  }

  lines.push("", "Description:", data.description);

  if (data.screenshotUrl) {
    lines.push("", "Screenshot: (see attached)");
  }

  const emailBody = lines.join("\n");

  // Download screenshot attachment if present
  const attachments: nodemailer.SendMailOptions["attachments"] = [];
  if (data.screenshotUrl) {
    try {
      // Extract the file path from the Firebase Storage URL
      const urlObj = new URL(data.screenshotUrl);
      const encodedPath = urlObj.pathname.split("/o/")[1]?.split("?")[0];
      if (encodedPath) {
        const filePath = decodeURIComponent(encodedPath);
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();
        const fileName = filePath.split("/").pop() || "screenshot.jpg";
        attachments.push({
          filename: fileName,
          content: fileBuffer,
        });
      }
    } catch (dlError) {
      console.error("Error downloading screenshot:", dlError);
      // Fall back to including the URL
      lines.pop(); // Remove "(see attached)"
      lines.push("", `Screenshot: ${data.screenshotUrl}`);
    }
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
      from: `"Band Central Support" <${smtpUser}>`,
      to: "support@bandcentral.com",
      replyTo: data.email,
      subject: `[${typeLabel}] ${data.subject}`,
      text: emailBody,
      attachments,
    });

    await snapshot.ref.update({ status: "sent" });
    console.log(`Contact request ${event.params.contactRequestId} email sent`);
  } catch (error) {
    console.error("Error sending contact request email:", error);
    await snapshot.ref.update({ status: "failed" });
  }
}
