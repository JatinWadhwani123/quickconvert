const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

/* GOOGLE */

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://quickconvert.online/auth/google/callback",
  proxy: true   // ✅ ADD THIS
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

module.exports = passport;