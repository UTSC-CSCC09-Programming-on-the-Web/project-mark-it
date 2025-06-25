import { User } from "../models/user.js";
import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/signout", function (req, res, next) {
  req.logout(function(err) {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to log out." });
      return res.redirect("/");
    });
  });
});

usersRouter.get("/me", async (req, res) => {
  if (req.user)
    return res.json({ googleId: req.user.googleId, displayName: req.user.displayName });
  return res.json({ googleId: null, displayName: null });
});