const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    default: ""
  },

  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ""
  },
  authProvider: {
    type: String,
    default: "local"
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: ""
  },
  resetOTP: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
