const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Resend } = require("resend");
const { z } = require("zod");

const User = require("../models/user");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

const resetSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase().trim())
});

const verifySchema = resetSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128)
});

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

router.post("/send-otp", async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ msg: "Invalid email" });

    const user = await User.findOne({ email: parsed.data.email });

    // Avoid account enumeration. Real users still receive mail.
    if (!user) return res.json({ msg: "If the account exists, an OTP has been sent." });

    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetOTP = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await resend.emails.send({
      from: `QuickConvert Support <${process.env.MAIL_FROM}>`,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset</h2>
        <p>Your QuickConvert OTP is:</p>
        <h1>${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `
    });

    res.json({ msg: "If the account exists, an OTP has been sent." });
  } catch (err) {
    console.error("Password reset email error:", err);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});

router.post("/verify-reset", async (req, res) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ msg: "Invalid reset request" });

    const { email, otp, newPassword } = parsed.data;
    const user = await User.findOne({ email });

    if (!user || !user.resetOTP || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    if (user.resetOTP !== hashOtp(otp)) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.authProvider = user.authProvider || "local";
    user.resetOTP = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ msg: "Password reset success" });
  } catch (err) {
    console.error("Password reset verify error:", err);
    res.status(500).json({ msg: "Reset failed" });
  }
});

module.exports = router;
