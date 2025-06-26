import { Router } from 'express'
import passport from 'passport'

export const oauthRouter = Router()

// Google signin
oauthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// Google signin callback
oauthRouter.get('/google/callback', passport.authenticate('google'), function (req, res) {
  return res.redirect('http://localhost:5173/')
})
