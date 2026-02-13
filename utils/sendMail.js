const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }

});

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

module.exports = sendOTP;
