import * as passport from "passport";
import * as request from "request";
import * as passportLocal from "passport-local";
import * as passportFacebook from "passport-facebook";
import * as passportTwitter from "passport-twitter";
import * as passportGithub  from "passport-github";
import * as passportGoogle from "passport-google-oauth";
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const OpenIDStrategy = require("passport-openid").Strategy;
const OAuthStrategy = require("passport-oauth").OAuthStrategy;
const OAuth2Strategy = require("passport-oauth").OAuth2Strategy;
import * as _ from "lodash";

// import { User, UserType } from '../models/User';
import { default as User } from "../models/User";
import { Request, Response, NextFunction } from "express";

const LocalStrategy = passportLocal.Strategy;
const FacebookStrategy = passportFacebook.Strategy;
const TwitterStrategy = passportTwitter.Strategy;
const GitHubStrategy = passportGithub.Strategy;
const GoogleStrategy = passportGoogle.OAuth2Strategy;

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
  User.findOne({ email: email.toLowerCase() }, (err, user: any) => {
    if (err) { return done(err); }
    if (!user) {
      return done(undefined, false, { message: `Email ${email} not found.` });
    }
    user.comparePassword(password, (err: Error, isMatch: boolean) => {
      if (err) { return done(err); }
      if (isMatch) {
        return done(undefined, user);
      }
      return done(undefined, false, { message: "Invalid email or password." });
    });
  });
}));


/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */


/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: "/auth/facebook/callback",
  profileFields: ["name", "email", "link", "locale", "timezone"],
  passReqToCallback: true
}, (req: any, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash("errors", { msg: "There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account." });
        done(err);
      } else {
        User.findById(req.user.id, (err, user: any) => {
          if (err) { return done(err); }
          user.facebook = profile.id;
          user.tokens.push({ kind: "facebook", accessToken });
          user.profile.name = user.profile.name || `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.save((err: Error) => {
            req.flash("info", { msg: "Facebook account has been linked." });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ facebook: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(undefined, existingUser);
      }
      User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash("errors", { msg: "There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings." });
          done(err);
        } else {
          const user: any = new User();
          user.email = profile._json.email;
          user.facebook = profile.id;
          user.tokens.push({ kind: "facebook", accessToken });
          user.profile.name = `${profile.name.givenName} ${profile.name.familyName}`;
          user.profile.gender = profile._json.gender;
          user.profile.picture = `https://graph.facebook.com/${profile.id}/picture?type=large`;
          user.profile.location = (profile._json.location) ? profile._json.location.name : "";
          user.save((err: Error) => {
            done(err, user);
          });
        }
      });
    });
  }
}));



// /**
//  * Sign in with GitHub.
//  */
// //  TODO: TEST
// passport.use(new GitHubStrategy({
//   clientID: process.env.GITHUB_ID,
//   clientSecret: process.env.GITHUB_SECRET,
//   callbackURL: "/auth/github/callback"
// }, (accessToken:any, refreshToken:any, profile:any, done:any)=>{
//   if (profile.user) {
//     User.findOne({ github: profile.id }, (err, existingUser) => {
//       if (existingUser) {
//         profile.flash('errors', { msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
//         done(err);
//       } else {
//         User.findById(profile.user.id, (err, user:any) => {
//           if (err) { return done(err); }
//           user.github = profile.id;
//           user.tokens.push({ kind: 'github', accessToken });
//           user.profile.name = user.profile.name || profile.displayName;
//           user.profile.picture = user.profile.picture || profile._json.avatar_url;
//           user.profile.location = user.profile.location || profile._json.location;
//           user.profile.website = user.profile.website || profile._json.blog;
//           user.save((err:any) => {
//             profile.flash('info', { msg: 'GitHub account has been linked.' });
//             done(err, user);
//           });
//         });
//       }
//     });
//   } else {
//     User.findOne({ github: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         return done(null, existingUser);
//       }
//       User.findOne({ email: profile._json.email }, (err, existingEmailUser) => {
//         if (err) { return done(err); }
//         if (existingEmailUser) {
//           profile.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.' });
//           done(err);
//         } else {
//           const user:any = new User();
//           user.email = profile._json.email;
//           user.github = profile.id;
//           user.tokens.push({ kind: 'github', accessToken });
//           user.profile.name = profile.displayName;
//           user.profile.picture = profile._json.avatar_url;
//           user.profile.location = profile._json.location;
//           user.profile.website = profile._json.blog;
//           user.save((err:any) => {
//             done(err, user);
//           });
//         }
//       });
//     });
//   }
// }));

// Sign in with Twitter.
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET,
  callbackURL: '/auth/twitter/callback',
  passReqToCallback: true
}, (req, accessToken, tokenSecret, profile, done) => {
  if (req.user) {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err:any, user:any) => {
          if (err) { return done(err); }
          user.twitter = profile.id;
          user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.location = user.profile.location || profile._json.location;
          user.profile.picture = user.profile.picture || profile._json.profile_image_url_https;
          user.save((err:any) => {
            if (err) { return done(err); }
            req.flash('info', { msg: 'Twitter account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ twitter: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      const user:any = new User();
      // Twitter will not provide an email address.  Period.
      // But a person’s twitter username is guaranteed to be unique
      // so we can "fake" a twitter email address as follows:
      user.email = `${profile.username}@twitter.com`;
      user.twitter = profile.id;
      user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
      user.profile.name = profile.displayName;
      user.profile.location = profile._json.location;
      user.profile.picture = profile._json.profile_image_url_https;
      user.save((err:any) => {
        done(err, user);
      });
    });
  }
}));


/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true
}, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(err);
      } else {
        User.findById(req.user.id, (err, user:any) => {
          if (err) { return done(err); }
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken });
          user.profile.name = user.profile.name || profile.displayName;
          user.profile.gender = user.profile.gender || profile._json.gender;
          user.profile.picture = user.profile.picture || profile._json.image.url;
          user.save((err:any) => {
            req.flash('info', { msg: 'Google account has been linked.' });
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ google: profile.id }, (err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ email: profile.emails[0].value }, (err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.' });
          done(err);
        } else {
          const user:any = new User();
          user.email = profile.emails[0].value;
          user.google = profile.id;
          user.tokens.push({ kind: 'google', accessToken });
          user.profile.name = profile.displayName;
          user.profile.gender = profile._json.gender;
          user.profile.picture = profile._json.image.url;
          user.save((err:any) => {
            done(err, user);
          });
        }
      });
    });
  }
}));

// /**
//  * Sign in with LinkedIn.
//  */
// passport.use(new LinkedInStrategy({
//   clientID: process.env.LINKEDIN_ID,
//   clientSecret: process.env.LINKEDIN_SECRET,
//   callbackURL: process.env.LINKEDIN_CALLBACK_URL,
//   scope: ['r_basicprofile', 'r_emailaddress'],
//   passReqToCallback: true
// }, (req:any, accessToken:any, refreshToken:any, profile:any, done:any) => {
//   if (req.user) {
//     User.findOne({ linkedin: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         req.flash('errors', { msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
//         done(err);
//       } else {
//         User.findById(req.user.id, (err, user:any) => {
//           if (err) { return done(err); }
//           user.linkedin = profile.id;
//           user.tokens.push({ kind: 'linkedin', accessToken });
//           user.profile.name = user.profile.name || profile.displayName;
//           user.profile.location = user.profile.location || profile._json.location.name;
//           user.profile.picture = user.profile.picture || profile._json.pictureUrl;
//           user.profile.website = user.profile.website || profile._json.publicProfileUrl;
//           user.save((err:any) => {
//             if (err) { return done(err); }
//             req.flash('info', { msg: 'LinkedIn account has been linked.' });
//             done(err, user);
//           });
//         });
//       }
//     });
//   } else {
//     User.findOne({ linkedin: profile.id }, (err, existingUser) => {
//       if (err) { return done(err); }
//       if (existingUser) {
//         return done(null, existingUser);
//       }
//       User.findOne({ email: profile._json.emailAddress }, (err, existingEmailUser) => {
//         if (err) { return done(err); }
//         if (existingEmailUser) {
//           req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.' });
//           done(err);
//         } else {
//           const user:any = new User();
//           user.linkedin = profile.id;
//           user.tokens.push({ kind: 'linkedin', accessToken });
//           user.email = profile._json.emailAddress;
//           user.profile.name = profile.displayName;
//           user.profile.location = profile._json.location.name;
//           user.profile.picture = profile._json.pictureUrl;
//           user.profile.website = profile._json.publicProfileUrl;
//           user.save((err:any) => {
//             done(err, user);
//           });
//         }
//       });
//     });
//   }
// }));


/**
 * Login Required middleware.
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next(res);
  }
  res.redirect("/login");
};

/**
 * Authorization Required middleware.
 */
export let isAuthorized = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.path.split("/").slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next(res);
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
