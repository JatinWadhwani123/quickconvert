const express = require("express");
const router = express.Router();
const Team = require("../models/team");
const authMiddleware = require("../middleware/authMiddleware");

// 🔹 CREATE TEAM
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const team = new Team({
      name,
      owner: req.user.id,
      members: [req.user.id]
    });

    await team.save();

    res.json(team);
  } catch {
    res.status(500).json({ msg: "Error creating team" });
  }
});

// 🔹 GET MY TEAMS
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({
      members: req.user.id
    });

    res.json(teams);
  } catch {
    res.status(500).json({ msg: "Error fetching teams" });
  }
});

// 🔹 INVITE MEMBER (FREE LINK)
router.post("/invite", authMiddleware, async (req, res) => {
  try {
    const { teamId, email } = req.body;

    const team = await Team.findById(teamId);

    if (!team) return res.status(404).json({ msg: "Team not found" });

    const token = Math.random().toString(36).substring(2);

    team.invites.push({ email, token });
    await team.save();

    const inviteLink = `https://quickconvert.online/join-team.html?token=${token}`;

    res.json({ inviteLink });

  } catch {
    res.status(500).json({ msg: "Invite error" });
  }
});

// 🔹 JOIN TEAM
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    const team = await Team.findOne({
      "invites.token": token
    });

    if (!team) return res.status(400).json({ msg: "Invalid link" });

    if (!team.members.includes(req.user.id)) {
      team.members.push(req.user.id);
    }

    // remove invite after join
    team.invites = team.invites.filter(i => i.token !== token);

    await team.save();

    res.json({ msg: "Joined team" });

  } catch {
    res.status(500).json({ msg: "Join failed" });
  }
});

module.exports = router;