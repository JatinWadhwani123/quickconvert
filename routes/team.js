const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Team = require("../models/Team");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");


// ✅ CREATE TEAM
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const team = new Team({
      name: req.body.name,
      owner: req.user.id,
      members: [
        {
          user: req.user.id,
          email: req.user.email,
          role: "admin"
        }
      ]
    });

    await team.save();

    res.json(team);
  } catch (err) {
    res.status(500).json({ msg: "Error creating team" });
  }
});


// ✅ GET MY TEAMS
router.get("/my", authMiddleware, async (req, res) => {
  const teams = await Team.find({
    "members.user": req.user.id
  });

  res.json(teams);
});


// ✅ INVITE MEMBER
router.post("/invite", authMiddleware, async (req, res) => {
  const { teamId, email } = req.body;

  try {
    const team = await Team.findById(teamId);

    if (!team) return res.status(404).json({ msg: "Team not found" });

    const token = crypto.randomBytes(20).toString("hex");

    team.invites.push({
      email,
      token
    });

    await team.save();

    // 🔥 EMAIL LINK
    const inviteLink = `https://yourdomain.com/join-team?token=${token}`;

    console.log("Invite link:", inviteLink);

    // Later we will send real email

    res.json({ msg: "Invite sent", inviteLink });

  } catch (err) {
    res.status(500).json({ msg: "Error inviting" });
  }
});


// ✅ ACCEPT INVITE
router.post("/accept", authMiddleware, async (req, res) => {
  const { token } = req.body;

  const team = await Team.findOne({ "invites.token": token });

  if (!team) return res.status(404).json({ msg: "Invalid invite" });

  const invite = team.invites.find(i => i.token === token);

  invite.status = "accepted";

  team.members.push({
    user: req.user.id,
    email: req.user.email
  });

  await team.save();

  res.json({ msg: "Joined team" });
});

module.exports = router;