"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inngest = exports.functions = void 0;
const client_1 = require("./client");
Object.defineProperty(exports, "inngest", { enumerable: true, get: function () { return client_1.inngest; } });
const sendOtp_1 = require("./functions/sendOtp");
// Import all your inngest functions
const sendSignInEmail_1 = require("./functions/sendSignInEmail");
// You can import more functions here:
// import { sendOrderConfirmationEmail } from "./functions/sendOrderConfirmationEmail";
exports.functions = [
    sendSignInEmail_1.sendSignInMessage,
    sendOtp_1.sendSignOtp,
    // Add more functions here as needed
];
