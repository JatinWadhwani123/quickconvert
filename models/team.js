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

<<<<<<< HEAD:models/team.js
module.exports = mongoose.model("Team", teamSchema);
=======
module.exports = mongoose.model("team", teamSchema);
>>>>>>> a061584 (fix pdfjs version):models/Team.js
