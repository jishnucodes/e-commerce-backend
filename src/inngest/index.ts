import { inngest } from "./client";
import { sendSignOtp } from "./functions/sendOtp";
 
// Import all your inngest functions
import { sendSignInMessage } from "./functions/sendSignInEmail";
// You can import more functions here:
// import { sendOrderConfirmationEmail } from "./functions/sendOrderConfirmationEmail";
 
export const functions = [
  sendSignInMessage,
  sendSignOtp,
  // Add more functions here as needed
];
 
export { inngest };