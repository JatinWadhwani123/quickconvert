const express = require("express");
const { z } = require("zod");
const router = express.Router();

const sendContactMail = require("../utils/sendContactMail");

const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email().transform(email => email.toLowerCase().trim()),
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(4000)
});

router.post("/", async (req, res) => {
  try {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) return res.status(400).json({ message: "Invalid contact fields" });

    await sendContactMail(parsed.data);

    res.json({ success: true });

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});

module.exports = router;
