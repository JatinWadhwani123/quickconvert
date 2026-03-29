const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: String,

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
      email: String,
      token: String
    }
  ]
});

module.exports = mongoose.model("Team", teamSchema);