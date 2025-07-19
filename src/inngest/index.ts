import { inngest } from "./client";
 
// Import all your inngest functions
import { sendSignInEmail } from "./functions/sendSignInEmail";
// You can import more functions here:
// import { sendOrderConfirmationEmail } from "./functions/sendOrderConfirmationEmail";
 
export const functions = [
  sendSignInEmail,
  // Add more functions here as needed
];
 
export { inngest };