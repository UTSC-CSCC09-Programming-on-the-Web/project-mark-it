import { User } from '../models/user.js'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.get('/signout', requireAuth, function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err)
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Failed to log out.' })
      return res.redirect('/')
    })
  })
})

usersRouter.get('/me', async function (req, res) {
  if (req.user) {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({
      googleId: user.googleId,
      displayName: user.displayName,
      isSubscribed: user.isSubscribed,
      customerId: user.customerId
    })
  }
  return res.json({ googleId: null, displayName: null, isSubscribed: false, customerId: null })
})
