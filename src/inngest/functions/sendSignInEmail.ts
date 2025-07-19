// inngest/functions/sendSignInEmail.ts
import { inngest } from "../client"
import { Resend } from "resend";
 
const resend = new Resend(process.env.RESEND_API_KEY!);
 console.log("Resend client initialized with API key:", process.env.RESEND_API_KEY);
export const sendSignInEmail = inngest.createFunction(
  { id: "send-signin-email" },
  { event: "user/signed-in" },
  async ({ event }) => {
    const { email, name, signInTime } = event.data;
  console.log("Sending sign-in email to:", email);
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "New Sign-In Detected",
        html: `
<p>Hello ${name || "there"},</p>
<p>We noticed a new sign-in to your account at:</p>
<p><strong>${new Date(signInTime).toLocaleString()}</strong></p>
<p>If this wasn't you, please contact support immediately.</p>
        `,
      });
 
      return { status: "sent" };
    } catch (error) {
      console.error("Failed to send sign-in email:", error);
      return { status: "failed", error };
    }
  }
);