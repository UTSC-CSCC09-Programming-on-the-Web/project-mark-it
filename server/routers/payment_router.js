// Base code obtained from:
// https://docs.stripe.com/billing/quickstart?lang=node
// as mentioned in the project description

import 'dotenv/config'
import { Router } from 'express'
import Stripe from 'stripe'
import { User } from '../models/user.js'
import { requireAuth } from '../middleware/auth.js'

// Sandbox test secret key
const stripe = new Stripe(process.env.STRIPE_TEST_SECRET)

export const paymentRouter = Router()

const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'http://localhost:5173'

paymentRouter.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { lookup_key } = req.body
    if (!lookup_key || typeof lookup_key !== 'string' || lookup_key.trim().length === 0)
      return res.status(400).json({ error: 'Missing or invalid lookup key' })

    const sanitized_lookup_key = lookup_key.trim()
    const prices = await stripe.prices.list({ lookup_keys: [sanitized_lookup_key] })
    if (!prices.data || prices.data.length === 0) return res.status(404).json({ error: 'Price not found' })

    let customerId
    if (req.user.customerId) customerId = req.user.customerId
    else {
      const customer = await stripe.customers.create({
        metadata: { googleId: req.user.googleId, userId: req.user.id.toString() }
      })
      customerId = customer.id
      await User.update({ customerId: customer.id }, { where: { id: req.user.id } })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      billing_address_collection: 'auto',
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_DOMAIN}/cancel`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('Error creating checkout session')
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Create portal session
paymentRouter.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || !user.customerId) return res.status(400).json({ error: 'No customer found' })

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${FRONTEND_DOMAIN}/`,
    })

    res.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session')
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})

// Stripe webhooks
paymentRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event

  if (!sig || !endpointSecret) return res.status(400).json({ error: 'Webhook configuration error' })

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed')
    return res.status(400).json({ error: 'Webhook' })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        const createdSubscription = event.data.object
        if (createdSubscription.status === 'active') {
          await User.update({ isSubscribed: true }, { where: { customerId: createdSubscription.customer } })
          console.log(`New subscription activated for customer: ${createdSubscription.customer}`)
        }
        break
      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object
        if (updatedSubscription.status === 'active') {
          await User.update({ isSubscribed: true }, { where: { customerId: updatedSubscription.customer } })
        } else if (updatedSubscription.status === 'canceled' || updatedSubscription.status === 'incomplete_expired') {
          await User.update({ isSubscribed: false }, { where: { customerId: updatedSubscription.customer } })
          console.log(`Subscription deactivated for customer: ${updatedSubscription.customer}`)
        }
        break
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        await User.update({ isSubscribed: false }, { where: { customerId: deletedSubscription.customer } })
        console.log(`Subscription deleted for customer: ${deletedSubscription.customer}`)
        break
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object
        await User.update({ isSubscribed: false }, { where: { customerId: failedInvoice.customer } })
        console.log(`Payment failed for customer: ${failedInvoice.customer}`)
        break
      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook')
    return res.status(500).json({ error: 'Webhook processing failed' })
  }

  res.json({ received: true })
})

// GitHub Copilot Prompt: "Check user subscription status on Stripe"

// Check subscription status
paymentRouter.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!user.customerId) {
      await User.update({ isSubscribed: false }, { where: { id: user.id } })
      return res.json({ isSubscribed: false, customerId: null })
    }

    // Check active subscriptions directly from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.customerId,
      status: 'active',
      limit: 1
    })
    const hasActiveSubscription = subscriptions.data.length > 0

    // Update local database to match Stripe
    if (user.isSubscribed !== hasActiveSubscription) {
      await User.update({ isSubscribed: hasActiveSubscription }, { where: { id: user.id } })
    }

    res.json({ isSubscribed: hasActiveSubscription, customerId: user.customerId })
  } catch (error) {
    console.error('Error finding subscription')
    res.status(500).json({ error: 'Failed to get subscription status' })
  }
})

// Cancel subscription
paymentRouter.post('/cancel-subscription', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user || !user.customerId) return res.status(400).json({ error: 'No customer found' })
    const subscriptions = await stripe.subscriptions.list({ customer: user.customerId, status: 'active' })
    if (subscriptions.data.length === 0) return res.status(400).json({ error: 'No active subscription found' })
    const subscription = subscriptions.data[0]
    await stripe.subscriptions.cancel(subscription.id)
    await User.update({ isSubscribed: false }, { where: { id: user.id } })
    res.json({ success: true, message: 'Subscription cancelled' })
  } catch (error) {
    console.error('Error cancelling subscription')
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

export default paymentRouter
