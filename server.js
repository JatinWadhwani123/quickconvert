const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");

const env = require("./config/env");
const connectDatabase = require("./config/database");
const applySecurityMiddleware = require("./middleware/security");
const { globalLimiter, authLimiter, contactLimiter } = require("./middleware/rateLimiters");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { cleanupExpiredUploads, startUploadCleanupJob } = require("./utils/fileCleanup");

const passport = require("./config/passport");
const User = require("./models/user");

const authRoutes = require("./routes/auth");
const resetRoutes = require("./routes/reset");
const contactRoutes = require("./routes/contact");
const teamRoutes = require("./routes/team");
const pageRoutes = require("./routes/pageRoutes");
const toolRoutes = require("./routes/toolRoutes");

const app = express();

applySecurityMiddleware(app);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(globalLimiter);

app.use(express.static(path.join(__dirname, "public"), {
  etag: true,
  maxAge: env.isProduction ? "7d" : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

app.use(passport.initialize());

app.use(pageRoutes);

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "quickconvert",
    environment: env.NODE_ENV,
    uptime: process.uptime()
  });
});

app.use("/api/reset", authLimiter, resetRoutes);
app.use("/api/contact", contactLimiter, contactRoutes);
app.use("/api", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use(toolRoutes);

app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false
  }),
  async (req, res, next) => {
    try {
      const profile = req.user;
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const name = profile.displayName || "";

      if (!email) return res.redirect("/login");

      const user = await User.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, name, password: "", authProvider: "google" } },
        { new: true, upsert: true }
      );

      const token = jwt.sign(
        { id: user._id },
        env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.redirect(`/auth-success.html?token=${token}`);
    } catch (err) {
      return next(err);
    }
  }
);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDatabase();
  await cleanupExpiredUploads();
  startUploadCleanupJob();

  app.listen(env.PORT, () => {
    console.log(`QuickConvert running on port ${env.PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start QuickConvert:", err);
  process.exit(1);
});

module.exports = app;
