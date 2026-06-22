const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  invites: [
    {
      email: {
        type: String,
        lowercase: true,
        trim: true
      },
      token: String,
      expiresAt: Date
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);
