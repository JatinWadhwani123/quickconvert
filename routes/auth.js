const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const router = express.Router();


// ================= REGISTER =================

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: "Missing fields" });

  try {
    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({ msg: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hash
    });

    await user.save();

    res.json({ msg: "User registered" });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= LOGIN =================

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ msg: "Invalid credentials" });

    // 🔐 2FA CHECK
    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        userId: user._id
      });
    }

    // ✅ NORMAL LOGIN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= 2FA LOGIN VERIFY =================

router.post("/2fa/login", async (req, res) => {
  const { userId, token } = req.body;

  try {
    const user = await User.findById(userId);

    const verified = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token: jwtToken });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});


// ================= CHANGE PASSWORD =================

router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch)
    return res.status(400).json({ message: "Wrong password" });

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.json({ message: "Password updated" });
});


// ================= 2FA SETUP =================

router.get("/2fa/generate", authMiddleware, async (req, res) => {
  const secret = speakeasy.generateSecret({ length: 20 });

  const user = await User.findById(req.user.id);

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qr = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    qr,
    secret: secret.base32
  });
});


// ================= 2FA VERIFY =================

router.post("/2fa/verify", authMiddleware, async (req, res) => {
  const { token } = req.body;

  const user = await User.findById(req.user.id);

  const verified = speakeasy.totp({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token
  });

  if (!verified) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.twoFactorEnabled = true;
  await user.save();

  res.json({ message: "2FA enabled successfully" });
});


// ================= 2FA DISABLE =================

router.post("/2fa/disable", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;

  await user.save();

  res.json({ message: "2FA disabled" });
});


// ================= GET CURRENT USER =================

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ msg: "No token" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);

  } catch {
    res.status(401).json({ msg: "Unauthorized" });
  }
});


// ================= UPDATE PROFILE =================

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    user.name = req.body.name || user.name;

    await user.save();

    res.json({ msg: "Profile updated" });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});


module.exports = router;