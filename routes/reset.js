const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const router = express.Router();
const User = require("../models/user");

// ===== OTP STORAGE =====

const otpStore = new Map();

// ===== MAIL TRANSPORT =====

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// ===== SEND OTP =====

router.post("/send-otp", async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.json({ msg: "Email not found" });

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(email, otp);

    // ===== SEND EMAIL =====

    await transporter.sendMail({
      from: `"QuickConvert Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "QuickConvert Password Reset OTP",
      html: `
        <h2>Password Reset</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#ff4d4d">${otp}</h1>
        <p>This OTP expires soon.</p>
      `
    });

    console.log("✅ OTP emailed to:", email);

    res.json({ msg: "OTP sent to email" });

  } catch (err) {

    console.error("MAIL ERROR:", err);

    res.status(500).json({ msg: "Failed to send OTP email" });

  }

});

// ===== VERIFY OTP + RESET =====

router.post("/verify-reset", async (req, res) => {

  try {

    const { email, otp, newPassword } = req.body;

    if (otpStore.get(email) != otp)
      return res.json({ msg: "Invalid OTP" });

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
