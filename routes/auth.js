const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { z } = require("zod");

const env = require("../config/env");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const emailSchema = z.string().email().transform(email => email.toLowerCase().trim());
const passwordSchema = z.string().min(8).max(128);
const otpSchema = z.string().regex(/^\d{6}$/);

function parseBody(schema, req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Invalid request fields" });
    return null;
  }
  return parsed.data;
}

function signUserToken(user, expiresIn = "2h") {
  return jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn });
}

router.post("/register", authLimiter, async (req, res) => {
  const body = parseBody(z.object({
    email: emailSchema,
    password: passwordSchema
  }), req, res);
  if (!body) return;

  try {
    const exists = await User.findOne({ email: body.email });
    if (exists) return res.status(400).json({ msg: "User exists" });

    const user = new User({
      email: body.email,
      password: await bcrypt.hash(body.password, 10),
      authProvider: "local"
    });

    await user.save();
    res.json({ msg: "User registered", token: signUserToken(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const body = parseBody(z.object({
    email: emailSchema,
    password: z.string().min(1).max(128)
  }), req, res);
  if (!body) return;

  try {
    const user = await User.findOne({ email: body.email });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    if (!user.password) return res.status(400).json({ msg: "Please continue with Google for this account" });

    const match = await bcrypt.compare(body.password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    if (user.twoFactorEnabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    res.json({ token: signUserToken(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/2fa/login", authLimiter, async (req, res) => {
  const body = parseBody(z.object({
    userId: z.string().min(1),
    token: otpSchema
  }), req, res);
  if (!body) return;

  try {
    const user = await User.findById(body.userId);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA is not configured" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: body.token,
      window: 1
    });

    if (!verified) return res.status(400).json({ message: "Invalid OTP" });

    res.json({ token: signUserToken(user) });
  } catch (err) {
    console.error("2FA login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/change-password", authMiddleware, async (req, res) => {
  const body = parseBody(z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema
  }), req, res);
  if (!body) return;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.password) return res.status(400).json({ message: "Password login is not enabled for this account" });

    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    user.password = await bcrypt.hash(body.newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Unable to update password" });
  }
});

router.get("/2fa/generate", authMiddleware, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: "QuickConvert"
    });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactorSecret = secret.base32;
    await user.save();

    res.json({
      qr: await QRCode.toDataURL(secret.otpauth_url),
      secret: secret.base32
    });
  } catch (err) {
    console.error("2FA generate error:", err);
    res.status(500).json({ message: "Unable to generate 2FA setup" });
  }
});

router.post("/2fa/verify", authMiddleware, async (req, res) => {
  const body = parseBody(z.object({ token: otpSchema }), req, res);
  if (!body) return;

  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA setup not found" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: body.token,
      window: 1
    });

    if (!verified) return res.status(400).json({ message: "Invalid OTP" });

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: "2FA enabled successfully" });
  } catch (err) {
    console.error("2FA verify error:", err);
    res.status(500).json({ message: "2FA verification failed" });
  }
});

router.post("/2fa/disable", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = "";
    await user.save();

    res.json({ message: "2FA disabled" });
  } catch (err) {
    console.error("2FA disable error:", err);
    res.status(500).json({ message: "Unable to disable 2FA" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ msg: "No token" });

    const decoded = jwt.verify(authHeader.split(" ")[1], env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password -twoFactorSecret -resetOTP");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch {
    res.status(401).json({ msg: "Unauthorized" });
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  const body = parseBody(z.object({
    name: z.string().trim().max(80).optional()
  }), req, res);
  if (!body) return;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.name = body.name || user.name;
    await user.save();

    res.json({ msg: "Profile updated" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
