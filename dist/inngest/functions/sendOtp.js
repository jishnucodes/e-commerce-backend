"use strict";
// // inngest/functions/sendSignInEmail.ts
// import { inngest } from "../client";
// import { Resend } from "resend";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSignOtp = void 0;
// if (!process.env.RESEND_API_KEY) {
//   throw new Error("RESEND_API_KEY is not set in environment variables.");
// }
// const resend = new Resend(process.env.RESEND_API_KEY);
// console.log("Resend client initialized");
// // Function to send OTP email
// export const sendSignOtp = inngest.createFunction(
//   { id: "send-signin-otp" },
//   { event: "user/otp-requested" },
//   async ({ event }) => {
//     const { email, otp, name } = event.data;
//     // Validate required fields
//     if (!email || !otp) {
//       console.error("Missing required fields:", { email, otp });
//       return {
//         status: "failed",
//         error: "Missing required fields: email or otp",
//       };
//     }
//     console.log("Sending sign-in OTP email to:", email);
//     try {
//       const response = await resend.emails.send({
//         from: "onboarding@resend.dev", // Make sure this is verified in Resend
//         to: email,
//         subject: "Your One-Time Password (OTP)",
//         html: `
//           <p>Hello ${name || "there"},</p>
//           <p>Your one time password is: <strong>${otp}</strong></p>
//           <p>If this wasn't you, please contact support immediately.</p>
//         `,
//       });
//       console.log("Email sent successfully:", response);
//       return { status: "sent" };
//     } catch (error) {
//       console.error("Failed to send sign-in OTP email:", error);
//       return { status: "failed", error };
//     }
//   }
// );
// inngest/functions/sendSignInEmail.ts
// import { inngest } from "../client";
// import sgMail from "@sendgrid/mail";
// // Set API key
// if (!process.env.SENDGRID_API_KEY) {
//   throw new Error("SENDGRID_API_KEY is not set");
// }
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// export const sendSignOtp = inngest.createFunction(
//   { id: "send-signin-otp" },
//   { event: "user/otp-requested" },
//   async ({ event }) => {
//     const { email, otp, name } = event.data;
//     // Validate inputs
//     if (!email || !otp) {
//       console.error("Missing required fields:", { email, otp });
//       return {
//         status: "failed",
//         error: "Missing required fields: email or otp",
//       };
//     }
//     try {
//       const msg = {
//         to: email,
//         from: "your_verified_sender@example.com", // You must verify this email in SendGrid
//         subject: "Your OTP Code",
//         html: `
//           <p>Hello ${name || "there"},</p>
//           <p>Your one-time password (OTP) is: <strong>${otp}</strong></p>
//           <p>If this wasn't you, please contact support immediately.</p>
//         `,
//       };
//       await sgMail.send(msg);
//       console.log("OTP email sent to:", email);
//       return { status: "sent" };
//     } catch (error) {
//       console.error("Error sending email via SendGrid:", error);
//       return { status: "failed", error };
//     }
//   }
// );
const client_1 = require("../client");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Define environment variable types (optional but helpful)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Create transporter
const createTransporter = () => {
    if (!EMAIL_USER || !EMAIL_PASS) {
        throw new Error("EMAIL_USER and EMAIL_PASS environment variables are required");
    }
    return nodemailer_1.default.createTransport({
        service: 'gmail', // You can change this
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });
};
exports.sendSignOtp = client_1.inngest.createFunction({ id: "send-signin-otp" }, { event: "user/otp-requested" }, async ({ event }) => {
    const { email, otp, name } = event.data;
    if (!email || !otp) {
        console.error("Missing required fields:", { email, otp });
        return {
            status: "failed",
            error: "Missing required fields: email or otp",
        };
    }
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"Your App Name" <${EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Hello ${name || "there"},\n\nYour one-time password (OTP) is: ${otp}\n\nIf this wasn't you, please contact support immediately.`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Your OTP Code</h2>
            <p>Hello ${name || "there"},</p>
            <p>Your one-time password (OTP) is:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #666;">If this wasn't you, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This is an automated message, please do not reply.</p>
          </div>
        `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully:", info.messageId);
        console.log("Email sent to:", email);
        return {
            status: "sent",
            messageId: info.messageId,
        };
    }
    catch (error) {
        console.error("Error sending email via Nodemailer:", error);
        return {
            status: "failed",
            error: error.message || "Unknown error"
        };
    }
});
