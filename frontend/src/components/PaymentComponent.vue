<template>
  <div>
    <button @click="createCheckoutSession">Subscribe with Stripe</button>
  </div>
</template>

<script>
export default {
  methods: {
    async createCheckoutSession() {
      const response = await fetch('http://localhost:3001/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup_key: 'markit_monthly_subscription' }),
      })
      const data = await response.json()
      window.location.href = data.url
    },
  },
}
</script>

<style>
button {
  font-size: 1rem;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
button:hover {
  background: #fff;
  color: #1976d2;
}
</style>
