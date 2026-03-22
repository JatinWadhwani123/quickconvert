const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();


// ===== REGISTER =====

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
router.post("/change-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated" });
});


// ===== LOGIN =====

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ msg: "Invalid credentials" });

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
router.get("/me", async (req, res) => {

  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ msg: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    res.json(user);

  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }

});
// ===== GET CURRENT USER =====
// ===== GET CURRENT USER =====

router.get("/me", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ msg: "No token" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);

  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
});
router.put("/update", authMiddleware, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.name = req.body.name || user.name;

    await user.save();

    res.json({ msg: "Profile updated" });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});
module.exports = router;
