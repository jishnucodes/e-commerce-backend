import { Resend } from 'resend';

const resend = new Resend('re_PJUJP6Ro_3TpqQj9DEfHBS4ErV7qUg3D7');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'radhinpzr@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});