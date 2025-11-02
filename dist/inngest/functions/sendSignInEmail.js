"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignInMessage = void 0;
// inngest/functions/sendSignInEmail.ts
const client_1 = require("../client");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Environment Variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Create nodemailer transporter
const createTransporter = () => {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("EMAIL_USER and EMAIL_PASS environment variables are required");
    }
    return nodemailer_1.default.createTransport({
        service: 'gmail', // Or Outlook, SES, etc.
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        }
    });
};
exports.sendSignInMessage = client_1.inngest.createFunction({ id: "send-signin-message" }, { event: "user/signed-in" }, async ({ event }) => {
    const { email, name = "there", signInTime, ipAddress = "Unknown IP", userAgent = "Unknown Device" } = event.data;
    if (!email || !signInTime) {
        console.error("Missing required fields in event data");
        return {
            status: "failed",
            error: "Missing required fields: email or signInTime"
        };
    }
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Your App Name" <${EMAIL_USER}>`,
            to: email,
            subject: "Successful Sign-In Alert",
            text: `Hello ${name},

You successfully signed in on ${signInTime}.

Details:
IP Address: ${ipAddress}
Device: ${userAgent}

If this wasn't you, please reset your password and contact support immediately.

- Your App Team`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #2d3748;">Sign-In Notification</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>You successfully signed in to your account.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0;"><strong>Sign-In Time:</strong></td>
                <td>${signInTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>IP Address:</strong></td>
                <td>${ipAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Device:</strong></td>
                <td>${userAgent}</td>
              </tr>
            </table>

            <p style="color: #718096;">If this wasn't you, please <a href="https://yourapp.com/reset-password" target="_blank" style="color: #e53e3e;">reset your password</a> and contact support.</p>

            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="font-size: 12px; color: #a0aec0;">This is an automated message from Your App. Do not reply to this email.</p>
          </div>
        `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Sign-in confirmation email sent:", info.messageId);
        return {
            status: "sent",
            messageId: info.messageId,
        };
    }
    catch (error) {
        console.error("❌ Error sending sign-in email:", error);
        return {
            status: "failed",
            error: error.message || "Unknown error"
        };
    }
});
