// src/inngest/functions/sendSignInEmail.ts

import { inngest } from "../client";
import { Resend } from "resend";

// Ensure the API key exists
if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendSignInEmail = inngest.createFunction(
  { id: "send-signin-email" },
  { event: "user/signed-in" },
  async ({ event }) => {
    const { email, name, signInTime } = event.data;

    if (!email) {
      console.error("Email is missing in event data.");
      return { status: "failed", error: "Missing email" };
    }

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev", // ✅ Must be from a verified domain
        to: email,
        subject: "New Sign-In Detected",
        html: `
          <p>Hello ${name || "there"},</p>
          <p>We noticed a new sign-in to your account at:</p>
          <p><strong>${new Date(signInTime).toLocaleString()}</strong></p>
          <p>If this wasn't you, please contact support immediately.</p>
        `,
      });

      console.log("Sign-in email sent to:", email);
      return { status: "sent" };
    } catch (error: any) {
      console.error("Failed to send sign-in email:", error?.message || error);
      return { status: "failed", error: error?.message || error };
    }
  }
);
