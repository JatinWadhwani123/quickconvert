const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      role: { type: String, default: "member" }
    }
  ],

  invites: [
    {
      email: String,
      token: String,
      status: { type: String, default: "pending" }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
