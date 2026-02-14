const express = require("express");
const router = express.Router();
const sendMail = require("../utils/sendMail");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    await sendMail({
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `
    });

    res.json({ message: "Message sent successfully!" });

  } catch (err) {
    res.status(500).json({ message: "Failed to send message." });
  }
});

module.exports = router;
