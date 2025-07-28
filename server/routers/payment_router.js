// Code obtained from:
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
    if (!lookup_key) return res.status(400).json({ error: 'Missing lookup key' })
    const prices = await stripe.prices.list({ lookup_keys: [lookup_key] })
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
    console.error('Error creating checkout session:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Stripe webhooks
paymentRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
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
          console.log(`Subscription activated for customer: ${updatedSubscription.customer}`)
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
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }

  res.json({ received: true })
})

// Check subscription status
paymentRouter.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ isSubscribed: user.isSubscribed, customerId: user.customerId })
  } catch (error) {
    console.error('Error finding subscription:', error)
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
    console.error('Error cancelling subscription:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

export default paymentRouter
