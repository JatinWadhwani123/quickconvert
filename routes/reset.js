const express = require("express");
const bcrypt = require("bcrypt");
const { Resend } = require("resend");

const router = express.Router();
const User = require("../models/user");

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== OTP MEMORY STORE =====
const otpStore = new Map();

// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(email, otp);

    await resend.emails.send({
      from: `QuickConvert Support <${process.env.MAIL_FROM}>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#ff4d4d">${otp}</h1>
        <p>This OTP expires soon.</p>
      `
    });

    console.log("✅ OTP sent:", email);

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});

// ================= VERIFY OTP =================
router.post("/verify-reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (otpStore.get(email) != otp)
      return res.status(400).json({ msg: "Invalid OTP" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { email },
      { password: hashed }
    );

    otpStore.delete(email);

    res.json({ msg: "Password reset success" });

  } catch {
    res.status(500).json({ msg: "Reset failed" });
  }
});

module.exports = router;
