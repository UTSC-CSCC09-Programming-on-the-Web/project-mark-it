<template>
  <div>
    <h3>Thanks for subscribing!</h3>
    <button @click="createPortalSession">Manage your billing information</button>
  </div>
</template>

<script>
const backendUrl = 'http://localhost:3001'

export default {
  mounted() {
    this.sessionId = new URLSearchParams(window.location.search).get('session_id')
  },
  methods: {
    async createPortalSession() {
      const response = await fetch(`${backendUrl}/api/payment/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId })
      })
      const data = await response.json()
      window.location.href = data.url
    }
  }
}
</script>


