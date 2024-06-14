"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (!authHeader) {
      console.warn('No authorization header found. Continuing without authentication.');
      return next();
    }
    const token = authHeader.replace(/^[Bb]earer /, "").trim();
    const decodedToken = jwt.verify(token, SECRET_KEY);
    res.locals.user = decodedToken;
    console.log('User is authenticated.');
    return next();
  } catch (e) {
      console.error('Error verifying token:', e.message);
      return next(); 
  }
};





function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user.isAdmin) throw new UnauthorizedError();
    return next();
  } catch (err) {
    console.warn("Could not check ANON permissions");
    return next(new UnauthorizedError());
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
};
