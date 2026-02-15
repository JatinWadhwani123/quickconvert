const express = require("express");
const router = express.Router();

const { sendContactMail } = require("../utils/sendMail");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    await sendContactMail(name, email, subject, message);

    res.json({ message: "Message sent successfully" });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
