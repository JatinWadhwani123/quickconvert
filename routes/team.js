const crypto = require("crypto");
const express = require("express");
const { z } = require("zod");

const Team = require("../models/team");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(80)
});

const inviteSchema = z.object({
  teamId: z.string().min(1),
  email: z.string().email().transform(email => email.toLowerCase().trim())
});

const joinSchema = z.object({
  token: z.string().min(32).max(128)
});

function parseBody(schema, req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Invalid request fields" });
    return null;
  }
  return parsed.data;
}

router.post("/create", authMiddleware, async (req, res) => {
  const body = parseBody(createTeamSchema, req, res);
  if (!body) return;

  try {
    const team = new Team({
      name: body.name,
      owner: req.user.id,
      members: [req.user.id]
    });

    await team.save();
    res.json(team);
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ msg: "Error creating team" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user.id }).sort({ updatedAt: -1 });
    res.json(teams);
  } catch (err) {
    console.error("Fetch teams error:", err);
    res.status(500).json({ msg: "Error fetching teams" });
  }
});

router.post("/invite", authMiddleware, async (req, res) => {
  const body = parseBody(inviteSchema, req, res);
  if (!body) return;

  try {
    const team = await Team.findById(body.teamId);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    if (String(team.owner) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Only the team owner can invite members" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    team.invites.push({ email: body.email, token, expiresAt });
    await team.save();

    res.json({
      inviteLink: `https://quickconvert.online/pages/join-team.html?token=${token}`,
      expiresAt
    });
  } catch (err) {
    console.error("Invite error:", err);
    res.status(500).json({ msg: "Invite error" });
  }
});

router.post("/join", authMiddleware, async (req, res) => {
  const body = parseBody(joinSchema, req, res);
  if (!body) return;

  try {
    const team = await Team.findOne({ "invites.token": body.token });
    if (!team) return res.status(400).json({ msg: "Invalid link" });

    const invite = team.invites.find(item => item.token === body.token);
    if (!invite || invite.expiresAt < new Date()) {
      team.invites = team.invites.filter(item => item.token !== body.token);
      await team.save();
      return res.status(400).json({ msg: "Invite link expired" });
    }

    if (!team.members.some(member => String(member) === String(req.user.id))) {
      team.members.push(req.user.id);
    }

    team.invites = team.invites.filter(item => item.token !== body.token);
    await team.save();

    res.json({ msg: "Joined team" });
  } catch (err) {
    console.error("Join team error:", err);
    res.status(500).json({ msg: "Join failed" });
  }
});

module.exports = router;
