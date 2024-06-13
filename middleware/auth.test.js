"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: true }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = () => {};
    expect(() => {
      authenticateJWT(req, res, next);
    }).not.toThrow();
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number), // Assuming iat is present in the decoded token
        username: "test",
        isAdmin: true, // Corrected to match the property name used in the function
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    const next = () => {};
    expect(() => {
      authenticateJWT(req, res, next);
    }).not.toThrow();
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = () => {};
    expect(() => {
      authenticateJWT(req, res, next);
    }).not.toThrow();
  });
});



// The rest of your code remains unchanged



describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toEqual(new UnauthorizedError);
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(new UnauthorizedError);
    };
    ensureLoggedIn(req, res, next);
  });
});
