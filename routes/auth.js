const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

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

module.exports = router;
