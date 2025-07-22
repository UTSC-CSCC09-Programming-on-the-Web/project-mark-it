// Code obtained from:
// https://docs.stripe.com/billing/quickstart?lang=node
// as mentioned in the project description

import 'dotenv/config'
import { Router } from 'express'
import Stripe from 'stripe'

// Sandbox test secret key
const stripe = new Stripe(process.env.STRIPE_TEST_SECRET)

export const paymentRouter = Router()

const FRONTEND_DOMAIN = 'http://localhost:5173'

paymentRouter.post('/create-checkout-session', async (req, res) => {
  try {
    const { lookup_key } = req.body

    if (!lookup_key) return res.status(400).json({ error: 'Missing lookup key' })

    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      expand: ['data.product'],
    })

    if (!prices.data || prices.data.length === 0) return res.status(404).json({ error: 'Price not found' })

    const session = await stripe.checkout.sessions.create({
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
    // Code obtained from:
    // https://docs.stripe.com/error-handling
    console.log(err)
    switch (err.type) {
      case 'StripeCardError':
        res.status(400).json({ error: 'Payment error' })
        break
      case 'StripeInvalidRequestError':
        res.status(400).json({ error: 'Invalid request' })
        break
      case 'StripeAPIError':
        res.status(500).json({ error: 'Something went wrong with Stripe' })
        break
      default:
        res.status(500).json({ error: 'An unexpected error occurred' })
        break
    }
  }
})

paymentRouter.post('/create-portal-session', async (req, res) => {
  try {
    const { session_id } = req.body

    if (!session_id) return res.status(400).json({ error: 'Missing session id' })

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

    if (!checkoutSession.customer)
      return res.status(400).json({ error: 'No session customer' })

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: FRONTEND_DOMAIN,
    })

    res.json({ url: portalSession.url })
  } catch (err) {
    // Code obtained from:
    // https://docs.stripe.com/error-handling
    console.log(err)
    switch (err.type) {
      case 'StripeInvalidRequestError':
        res.status(400).json({ error: 'Invalid request' })
        break
      case 'StripeAPIError':
        res.status(500).json({ error: 'Something went wrong with Stripe' })
        break
      default:
        res.status(500).json({ error: 'An unexpected error occurred' })
        break
    }
  }
})
