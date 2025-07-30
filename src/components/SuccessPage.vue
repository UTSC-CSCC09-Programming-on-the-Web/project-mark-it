// Base code obtained from: // https://docs.stripe.com/billing/quickstart?lang=node // as mentioned
in the project description

<template>
  <div class="success-container">
    <div class="success-content">
      <h1>Welcome to Mark-It!</h1>
      <p>Your subscription is now active. You can now access all premium features.</p>
      <button @click="goHome" class="get-started-btn">Get Started</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sessionId: null,
    }
  },
  mounted() {
    this.sessionId = new URLSearchParams(window.location.search).get('session_id')
  },
  methods: {
    goHome() {
      window.location.href = '/'
    },
  },
}
</script>

<style scoped>
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8fafc;
}

.success-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
  max-width: 500px;
  width: 90%;
  border: 1px solid #e2e8f0;
}

.success-content h1 {
  color: #1976d2;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 600;
}

.success-content p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.get-started-btn {
  background: #1976d2;
  color: white;
  border: 1px solid #1976d2;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  margin: 0.5rem;
}

.get-started-btn:hover {
  background: #fff;
  color: #1976d2;
}
</style>
