const mongoose = require("mongoose");

const env = require("./env");

async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });
}

module.exports = connectDatabase;
