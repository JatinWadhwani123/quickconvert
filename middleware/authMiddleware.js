const jwt = require("jsonwebtoken");
const env = require("../config/env");

module.exports = function (req, res, next) {

  const authHeader = req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }

};
