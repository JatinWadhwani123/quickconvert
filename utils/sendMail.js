const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/* ================= OTP MAIL ================= */

async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: `"QuickConvert Security" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your QuickConvert OTP Code",
    html: `
      <h2>Password Reset OTP</h2>
      <p>Your OTP code is:</p>
      <h1>${otp}</h1>
      <p>This code expires soon.</p>
    `
  });
}

/* ================= CONTACT MAIL ================= */

async function sendContactMail(name, email, subject, message) {
  await transporter.sendMail({
    from: `"QuickConvert Contact" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    subject: `Contact Form: ${subject}`,
    html: `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b><br>${message}</p>
    `
  });
}

/* ================= EXPORT BOTH ================= */

module.exports = {
  sendOTP,
  sendContactMail
};
