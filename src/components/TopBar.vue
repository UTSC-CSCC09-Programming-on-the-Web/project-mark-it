<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['unsubscribe'])

const API_BASE_URL = 'http://localhost:3001'
const user = ref({ googleId: null, displayName: null })
const userLoading = ref(true)

async function fetchUser() {
  userLoading.value = true
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
    user.value = await res.json()
  } catch (error) {
    console.error('Error fetching user:', error)
    user.value = { googleId: null, displayName: null }
  }
  userLoading.value = false
}

async function signOut() {
  try {
    await fetch(`${API_BASE_URL}/api/users/signout`, { credentials: 'include' })
    // Redirect to root which will be the login page
    window.location.href = '/'
  } catch (error) {
    console.error('Error signing out:', error)
    // Refresh even on error
    window.location.href = '/'
  }
}

function handleUnsubscribe() {
  emit('unsubscribe')
}

onMounted(fetchUser)
</script>

<template>
  <nav class="top-bar">
    <div class="top-bar-content">
      <span class="app-title">Mark It</span>
      <div class="top-bar-actions">
        <span class="welcome" v-if="user.googleId">Welcome, {{ user.displayName }}</span>
        <span v-if="userLoading">...</span>
        <template v-else>
          <template v-if="!user.googleId">
            <a :href="`${API_BASE_URL}/auth/google`">
              <button id="oauth">Sign In With Google</button>
            </a>
          </template>
          <template v-else>
            <button @click="handleUnsubscribe" title="Cancel your subscription">Unsubscribe</button>
            <button @click="signOut">Sign Out</button>
          </template>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 56px;
  background: #ffffff;
  color: #fff;
  border-bottom: 2px solid #000000;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
}
.top-bar-content {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  justify-content: space-between;
}
.app-title {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
  color: #000;
}
.top-bar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.top-bar-actions button {
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
.top-bar-actions button:hover {
  background: #fff;
  color: #1976d2;
}
.welcome {
  font-size: 1rem;
  color: #000;
  margin-right: 12px;
}
</style>
