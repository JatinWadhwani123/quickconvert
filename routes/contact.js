const express = require("express");
const router = express.Router();

const sendContactMail = require("../utils/sendContactMail");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    await sendContactMail({ name, email, subject, message });

    res.json({ success: true });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
