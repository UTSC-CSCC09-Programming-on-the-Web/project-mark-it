import { User } from '../models/user.js'

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' })
  next()
}

export async function requireSubscription(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' })
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(401).json({ error: 'User not found' })
    if (!user.isSubscribed) return res.status(403).json({ error: 'User is not subscribed' })
    next()
  } catch (error) {
    console.error('Error finding subscription:', error)
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
