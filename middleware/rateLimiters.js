const rateLimit = require("express-rate-limit");

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message
      }
    }
  });
}

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: "Too many requests. Please slow down."
});

const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Please try again later."
});

const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many file operations. Please wait a bit before trying again."
});

const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many contact requests. Please try again later."
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  contactLimiter
};
