const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const router = express.Router();


// ===== REQUEST OTP =====

router.post("/request-otp", async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({ msg: "User not found" });

  const otp = crypto.randomInt(100000, 999999).toString();

  user.resetOTP = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  console.log("🔥 OTP:", otp);

  res.json({ msg: "OTP generated (check server console)" });

});


// ===== VERIFY OTP + RESET =====

router.post("/verify-otp", async (req, res) => {

  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user ||
      user.resetOTP !== otp ||
      Date.now() > user.otpExpiry)
    return res.status(400).json({ msg: "Invalid or expired OTP" });

  user.password = await bcrypt.hash(newPassword, 10);

  user.resetOTP = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ msg: "Password reset successful" });

});

module.exports = router;
