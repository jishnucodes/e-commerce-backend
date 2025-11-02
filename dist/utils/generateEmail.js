"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const resend = new resend_1.Resend('re_PJUJP6Ro_3TpqQj9DEfHBS4ErV7qUg3D7');
resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'radhinpzr@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});
//# sourceMappingURL=generateEmail.js.map