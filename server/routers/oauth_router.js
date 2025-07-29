import { Router } from 'express'
import passport from 'passport'
import { User } from '../models/user.js'

export const oauthRouter = Router()

const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'http://localhost:5173'

// Google signin
oauthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// Google signin callback
oauthRouter.get('/google/callback', passport.authenticate('google'), async function (req, res) {
  try {
    const user = await User.findByPk(req.user.id)
    if (user && user.isSubscribed) return res.redirect(FRONTEND_DOMAIN + '/')
    else return res.redirect(FRONTEND_DOMAIN + '/?showPaywall=true')
  } catch (error) {
    console.error('Error checking subscription:', error)
    return res.redirect(FRONTEND_DOMAIN + '/?showPaywall=true')
  }
})
