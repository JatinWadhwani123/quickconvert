const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

/* GOOGLE */

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://quickconvert.online/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

/* FACEBOOK */

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || null;

    const user = {
      facebookId: profile.id,
      name: profile.displayName,
      email: email
    };

    return done(null, user);

  } catch (err) {
    console.log("FB ERROR:", err);
    return done(err, null);
  }
}));

module.exports = passport;