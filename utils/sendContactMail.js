const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendContactMail({ name, email, subject, message }) {
  await resend.emails.send({
    from: "QuickConvert <support@quickconvert.online>", // must be verified domain later
    to: process.env.EMAIL_USER, // where you want to receive messages
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
    `
  });
}

module.exports = sendContactMail;
