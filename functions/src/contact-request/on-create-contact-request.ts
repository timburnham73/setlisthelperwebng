import { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";

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
    lines.push("", `Screenshot: ${data.screenshotUrl}`);
  }

  const emailBody = lines.join("\n");

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
    });

    await snapshot.ref.update({ status: "sent" });
    console.log(`Contact request ${event.params.contactRequestId} email sent`);
  } catch (error) {
    console.error("Error sending contact request email:", error);
    await snapshot.ref.update({ status: "failed" });
  }
}
