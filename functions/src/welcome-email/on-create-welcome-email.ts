import { FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";

interface WelcomeEmailRequest {
  email: string;
  displayName: string;
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

  const data = snapshot.data() as WelcomeEmailRequest;

  const greeting = data.displayName ? `Hi ${data.displayName},` : "Hi,";

  const emailBody = `${greeting}

Thank you for joining Band Central.

As one of our early users, your feedback is incredibly valuable to us. Please reach out if you have suggestions for new features or if anything is not working as expected. I am eager to work with you to help shape the future of the app.

Cheers,

Tim
www.bandcentral.com`;

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
      to: data.email,
      replyTo: "support@bandcentral.com",
      subject: "Welcome to Band Central",
      text: emailBody,
    });

    await snapshot.ref.update({ status: "sent" });
    console.log(`Welcome email sent to ${data.email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    await snapshot.ref.update({ status: "failed" });
  }
}
