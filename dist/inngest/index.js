"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inngest = exports.functions = void 0;
const client_1 = require("./client");
Object.defineProperty(exports, "inngest", { enumerable: true, get: function () { return client_1.inngest; } });
const sendOtp_1 = require("./functions/sendOtp");
const sendSignInEmail_1 = require("./functions/sendSignInEmail");
exports.functions = [
    sendSignInEmail_1.sendSignInMessage,
    sendOtp_1.sendSignOtp,
];
//# sourceMappingURL=index.js.map