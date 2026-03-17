const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

/* GOOGLE */

passport.use(new GoogleStrategy({
  clientID: "GOOGLE_CLIENT_ID",
  clientSecret: "GOOGLE_CLIENT_SECRET",
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

/* FACEBOOK */

passport.use(new FacebookStrategy({
  clientID: "FACEBOOK_APP_ID",
  clientSecret: "FACEBOOK_APP_SECRET",
  callbackURL: "/auth/facebook/callback",
  profileFields: ["id","displayName","emails"]
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

module.exports = passport;