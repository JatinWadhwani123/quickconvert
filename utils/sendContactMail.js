const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendContactMail({ name, email, subject, message }) {
  await resend.emails.send({
    from: "QuickConvert <support@quickconvert.online>", // must be verified domain later
    to: process.env.EMAIL_USER, // where you want to receive messages
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Subject:</b> ${escapeHtml(subject)}</p>
      <p><b>Message:</b></p>
      <p>${escapeHtml(message)}</p>
    `
  });
}

module.exports = sendContactMail;
