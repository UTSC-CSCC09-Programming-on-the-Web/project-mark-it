// Base code obtained from:
// https://docs.stripe.com/billing/quickstart?lang=node
// as mentioned in the project description

<template>
  <div class="payment-component">
    <div class="subscription-info">
      <h3>Subscribe to Mark-it Monthly Subscription</h3>
      <div class="pricing">
        <span class="price">CA$2.00</span>
        <div class="period-info">
          <span class="per">per</span>
          <span class="period">month</span>
        </div>
      </div>
      <p class="description">Subscribe monthly to unlock Mark-it — a collaborative drawing platform where you and your friends can produce masterpieces together in real-time on a shared canvas using powerful AI tools to boost your creativity and enhance your art.</p>
    </div>
    <button @click="createCheckoutSession" class="subscribe-btn">
      Subscribe Now
    </button>
  </div>
</template>

<script>
const API_BASE_URL = 'http://localhost:3001'

export default {
  emits: ['success', 'cancel'],
  methods: {
    async createCheckoutSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ lookup_key: 'markit_monthly_subscription' })
        })
        if (!response.ok) throw new Error('Error creating checkout session')
        const data = await response.json()

        // Go to Stripe checkout page in the same window
        window.location.href = data.url
      } catch (error) {
        console.error('Error creating checkout session:', error)
        this.$emit('cancel')
      }
    }
  }
}
</script>

<style scoped>
.payment-component {
  text-align: center;
  margin: 1rem 0;
}

.subscription-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
}

.subscription-info h3 {
  color: #1976d2;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.pricing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.price {
  font-size: 2rem;
  font-weight: 700;
  color: #1976d2;
}

.period-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.per {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1;
}

.period {
  font-size: 1rem;
  color: #64748b;
  line-height: 1;
}

.description {
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  text-align: left;
  margin-top: 1rem;
}

.subscribe-btn {
  font-size: 1rem;
  padding: 12px 32px;
  border-radius: 6px;
  border: 1px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-weight: 500;
}

.subscribe-btn:hover {
  background: #fff;
  color: #1976d2;
}
</style>
