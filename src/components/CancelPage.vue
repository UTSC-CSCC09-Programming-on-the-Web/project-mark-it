// Base code obtained from:
// https://docs.stripe.com/billing/quickstart?lang=node
// as mentioned in the project description

<template>
  <div class="cancel-container">
    <div class="cancel-content">
      <div class="cancel-icon">✕</div>
      <h3>Subscription Cancelled</h3>
      <p>You chose not to complete the subscription process.</p>
      <p>Please subscribe to access Mark-It features.</p>
      <div class="action-buttons">
        <button @click="tryAgain" class="retry-btn">Try Subscribing Again</button>
        <button @click="signOutAndRedirect" class="signout-btn">Signout</button>
      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '../../config.js'

export default {
  methods: {
    async signOutAndRedirect() {
      try {
        await fetch(`${API_BASE_URL}/api/users/signout`, { credentials: 'include' })
      } catch (error) {
        console.error('Error signing out:', error)
      } finally {
        window.location.href = '/'
      }
    },
    tryAgain() {
      window.location.href = '/?showPaywall=true'
    }
  }
}
</script>

<style scoped>
/* GitHub Copilot Prompt: "Edit UI to match with home page styling" */

.cancel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.cancel-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
  max-width: 500px;
  width: 90%;
  border: 1px solid #e2e8f0;
}

.cancel-icon {
  width: 80px;
  height: 80px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: white;
  font-weight: bold;
}

.cancel-content h3 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #1976d2;
  font-weight: 600;
}

.cancel-content p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #64748b;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

button {
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-weight: 500;
}

.retry-btn {
  background: #1976d2;
  border-color: #1976d2;
  color: white;
}

.retry-btn:hover {
  background: #fff;
  color: #1976d2;
}

.signout-btn {
  background: #64748b;
  border-color: #64748b;
  color: white;
}

.signout-btn:hover {
  background: #fff;
  color: #64748b;
}
</style>


