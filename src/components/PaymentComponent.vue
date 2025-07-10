<template>
  <div>
    <h3>Subscription to Market for $2.00 a month</h3>
    <button @click="createCheckoutSession">Checkout</button>
  </div>
</template>

<script>
export default {
  methods: {
    async createCheckoutSession() {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup_key: 'markit_monthly_subscription' })
      })
      const data = await response.json()
      window.location.href = data.url
    }
  }
}
</script>


