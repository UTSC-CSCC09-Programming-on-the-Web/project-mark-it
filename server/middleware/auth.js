import { User } from '../models/user.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET)

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' })
  next()
}

export async function requireSubscription(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not signed in' })
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(401).json({ error: 'User not found' })
    if (!user.customerId) {
      await User.update({ isSubscribed: false }, { where: { id: user.id } })
      return res.status(403).json({ error: 'User is not subscribed' })
    }

    // Reused GitHub Copilot code cited in payment_router.js
    // With Prompt: "Check user subscription status on Stripe"
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      status: 'active',
      limit: 1
    })
    const hasActiveSubscription = subscriptions.data.length > 0

    if (user.isSubscribed !== hasActiveSubscription)
      await User.update({ isSubscribed: hasActiveSubscription }, { where: { id: user.id } })
    if (!hasActiveSubscription) return res.status(403).json({ error: 'User is not subscribed' })

    next()
  } catch (error) {
    console.error('Error checking subscription')
    return res.status(500).json({ error: 'Unexpected error occurred' })
  }
}
