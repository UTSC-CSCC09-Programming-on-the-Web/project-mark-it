<script setup>
import Markboard from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'
import TopBar from './components/TopBar.vue'
import PaymentComponent from './components/PaymentComponent.vue'
import SuccessPage from './components/SuccessPage.vue'
import CancelPage from './components/CancelPage.vue'
import { ref, onMounted } from 'vue'
import { joinRoom, requestMarkboard } from './js/socket.js'
import { API_BASE_URL } from '../config.js'

// Stripe paywall and auth states
const user = ref(null)
const isLoading = ref(true)
const showPaywall = ref(false)
const showLoginPage = ref(false)
const currentRoute = ref('')
const roomName = ref('')
const roomInput = ref('')

// Stripe paywall routes
function getCurrentRoute() {
  const path = window.location.pathname
  if (path === '/success') return 'success'
  if (path === '/cancel') return 'cancel'
  return 'home'
}

// Check if user logged in and is subscribed
async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/me`, { credentials: 'include' })
    const userData = await res.json()

    if (userData.googleId) {
      user.value = userData
      if (currentRoute.value === 'success' || currentRoute.value === 'cancel') return

      const subscriptionRes = await fetch(`${API_BASE_URL}/api/payment/subscription-status`, { credentials: 'include' })
      const subscriptionData = await subscriptionRes.json()

      if (subscriptionRes.ok && subscriptionData.isSubscribed) {
        user.value.isSubscribed = subscriptionData.isSubscribed
        await fetchUserFiles()
      }
      else showPaywall.value = true
    }
    else {
      if (currentRoute.value !== 'success' && currentRoute.value !== 'cancel') showLoginPage.value = true
    }
  } catch (error) {
    console.error('Error checking auth status:', error)
    if (currentRoute.value !== 'success' && currentRoute.value !== 'cancel') showLoginPage.value = true
  } finally {
    isLoading.value = false
  }
}

function handleGoogleLogin() {
  window.location.href = `${API_BASE_URL}/auth/google`
}

async function handleSignout() {
  try {
    await fetch(`${API_BASE_URL}/api/users/signout`, { credentials: 'include' })
    user.value = null
    showPaywall.value = false
    showLoginPage.value = true
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

function handleSubscriptionSuccess() {
  showPaywall.value = false
  checkAuthStatus()
}

function handleSubscriptionCancel() {
  handleSignout()
}

async function handleUnsubscribe() {
  if (!confirm('Are you sure you want to unsubscribe? You will lose access to all premium features.')) return

  try {
    const res = await fetch(`${API_BASE_URL}/api/payment/cancel-subscription`, {
      method: 'POST',
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok) {
      alert('Successfully unsubscribed. You can resubscribe anytime to regain access to premium features.')
      // Redirect to subscription page
      showPaywall.value = true
      // Update user subscription status locally
      if (user.value) user.value.isSubscribed = false
    }
    else alert('Failed to unsubscribe: ' + (data.error || 'Unknown error'))

  } catch (error) {
    console.error('Error unsubscribing:', error)
    alert('Failed to unsubscribe: ' + error.message)
  }
}

onMounted(() => {
  currentRoute.value = getCurrentRoute()
  if (currentRoute.value === 'success' || currentRoute.value === 'cancel') {
    isLoading.value = false
    checkAuthStatus()
    return
  }

  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('showPaywall') === 'true') {
    showPaywall.value = true
    window.history.replaceState({}, document.title, window.location.pathname)
  }
  checkAuthStatus()
})

// File upload logic
const fileInput = ref(null)
const userFiles = ref([]) // Store user's files
const selectedFileId = ref('')
const shareGoogleId = ref('')

// Fetch user's files on mount
async function fetchUserFiles() {
  if (!user.value || !user.value.isSubscribed) {
    userFiles.value = []
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/files/`, {
      credentials: 'include',
    })
    if (res.ok) {
      userFiles.value = await res.json()
    } else {
      userFiles.value = []
    }
    console.log('Fetched user files:', userFiles.value)
  } catch {
    userFiles.value = []
  }
}

// After upload, refresh the list
async function uploadFile(event) {
  event.preventDefault()
  const file = fileInput.value.files[0]
  if (!file) {
    alert('Please select a file.')
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch(`${API_BASE_URL}/api/files/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      alert('File uploaded successfully!')
      console.log(data)
      fileInput.value.value = ''
      fetchUserFiles() // Refresh dropdown
    } else {
      alert('Upload failed: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    alert('Upload failed: ' + err.message)
  }
}

function handleDownload(event) {
  event.preventDefault()
  if (!selectedFileId.value) {
    alert('Please select a file to download.')
    return
  }
  // Create a temporary link to trigger download
  const url = `${API_BASE_URL}/api/files/download/${selectedFileId.value}`
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener'
  link.click()
}

async function handleShare(event) {
  event.preventDefault()
  if (!selectedFileId.value || !shareGoogleId.value) {
    alert('Please select a file and enter a googleId.')
    return
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/files/share/${selectedFileId.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ googleId: shareGoogleId.value }),
    })
    const data = await res.json()
    if (res.ok) {
      alert('File shared successfully!')
      shareGoogleId.value = ''
    } else {
      alert('Share failed: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    alert('Share failed: ' + err.message)
  }
}

const markboardRef = ref(null)
const maskModeText = ref('Mask Mode')
let maskModeOn = false

function handleToggleMaskMode() {
  if (markboardRef.value && typeof markboardRef.value.toggleMaskMode === 'function') {
    maskModeOn = markboardRef.value.toggleMaskMode()
    maskModeText.value = maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
  }
}

const aiPrompt = ref('')

function handleGenerativeFill(event) {
  event.preventDefault()
  if (!aiPrompt.value) {
    alert('Please enter a prompt.')
    return
  }
  if (!maskModeOn) {
    alert('Please enable mask mode to use generative fill.')
    return
  }
  if (!markboardRef.value) {
    alert('Markboard not ready.')
    return
  }

  toggleLoading() // Turn loading on

  markboardRef.value.getJpegBlob().then((imageBlob) => {
    if (!imageBlob) {
      alert('Could not get image from markboard.')
      toggleLoading()
      return
    }
    markboardRef.value.getMaskPngBlob().then((maskBlob) => {
      if (!maskBlob) {
        alert('Could not get mask from maskboard.')
        toggleLoading()
        return
      }

      const formData = new FormData()
      formData.append('prompt', aiPrompt.value)
      formData.append('image', imageBlob, 'image.jpg')
      formData.append('mask', maskBlob, 'mask.png')
      formData.append('imageMime', 'image/jpeg')
      formData.append('maskMime', 'image/png')

      fetch(`${API_BASE_URL}/api/ai_fill/generative-fill`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              alert('AI Fill failed: ' + (err.error || 'Unknown error'))
              throw new Error('AI Fill failed')
            })
          }
          return res.blob()
        })
        .then((blob) => {
          if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
            markboardRef.value.setImageOnMarkboard(blob)
          }
          // Turn off mask mode after generation
          if (
            markboardRef.value &&
            typeof markboardRef.value.toggleMaskMode === 'function' &&
            markboardRef.value.maskMode
          ) {
            maskModeOn = markboardRef.value.toggleMaskMode()
            maskModeText.value = maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
          }
          toggleLoading() // Turn loading off
        })
        .catch((err) => {
          if (err.message !== 'AI Fill failed') {
            alert('AI Fill failed: ' + err.message)
          }
          // Also turn off mask mode on error
          if (
            markboardRef.value &&
            typeof markboardRef.value.toggleMaskMode === 'function' &&
            markboardRef.value.maskMode
          ) {
            maskModeOn = markboardRef.value.toggleMaskMode()
            maskModeText.value = maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
          }
          toggleLoading() // Turn loading off
        })
    })
  })
}

function handleAIReimagine (event) {
  event.preventDefault()
  if (!markboardRef.value) {
    alert('Markboard not ready.')
    return
  }

  toggleLoading() // Turn loading on

  markboardRef.value.getJpegBlob().then((imageBlob) => {
    if (!imageBlob) {
      alert('Could not get image from markboard.')
      toggleLoading()
      return
    }
    const formData = new FormData()
    formData.append('image', imageBlob, 'image.jpg')
    formData.append('imageMime', 'image/jpeg')

    fetch(`${API_BASE_URL}/api/ai_fill/reimagine`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            alert('AI Fill failed: ' + (err.error || 'Unknown error'))
            throw new Error('AI Fill failed')
          })
        }
        return res.blob()
      })
      .then((blob) => {
        if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
          markboardRef.value.setImageOnMarkboard(blob)
        }
        toggleLoading() // Turn loading off
      })
      .catch((err) => {
        if (err.message !== 'AI Fill failed') {
          alert('AI Fill failed: ' + err.message)
        }
        toggleLoading() // Turn loading off
      })
  })
}

function handleTextToImage(event) {
  event.preventDefault()
  if (!aiPrompt.value) {
    alert('Please enter a prompt.')
    return
  }
  if (!markboardRef.value) {
    alert('Markboard not ready.')
    return
  }

  toggleLoading() // Turn loading on

  const formData = new FormData()
  formData.append('prompt', aiPrompt.value)

  fetch(`${API_BASE_URL}/api/ai_fill/text-to-image/`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
  .then((res) => {
    if (!res.ok) {
      return res.json().then((err) => {
        alert('Text To Image failed: ' + (err.error || 'Unknown error'))
        throw new Error('Text To Image failed')
      })
    }
    return res.blob()
  })
  .then((blob) => {
    if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
      markboardRef.value.setImageOnMarkboard(blob)
    }
    toggleLoading() // Turn loading off
  })
  .catch((err) => {
    if (err.message !== 'Text To Image failed') {
      alert('Text To Image failed: ' + err.message)
    }
    toggleLoading() // Turn loading off
  })
}

function handleGenerativeFillV2(event) {
  event.preventDefault()
  if (!aiPrompt.value) {
    alert('Please enter a prompt.')
    return
  }
  if (!maskModeOn) {
    alert('Please enable mask mode to use generative fill.')
    return
  }
  if (!markboardRef.value) {
    alert('Markboard not ready.')
    return
  }

  toggleLoading() // Turn loading on

  markboardRef.value.getJpegBlob().then((imageBlob) => {
    if (!imageBlob) {
      alert('Could not get image from markboard.')
      toggleLoading()
      return
    }
    markboardRef.value.getMaskPngBlob().then((maskBlob) => {
      if (!maskBlob) {
        alert('Could not get mask from maskboard.')
        toggleLoading()
        return
      }

      const formData = new FormData()
      formData.append('prompt', aiPrompt.value)
      formData.append('image', imageBlob, 'image.jpg')
      formData.append('mask', maskBlob, 'mask.png')
      formData.append('imageMime', 'image/jpeg')
      formData.append('maskMime', 'image/png')

      fetch(`${API_BASE_URL}/api/ai_fill/generative-fill-v2`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              alert('AI Fill failed: ' + (err.error || 'Unknown error'))
              throw new Error('AI Fill failed')
            })
          }
          return res.json()
        })
        .then((data) => {
          console.log('PhotAI response data:', data);

          // Handle the new response format from PhotAI Object Replacer API
          let imageUrl;
          if (data.output_urls && data.output_urls.length > 0) {
            // Use the first output image from the array
            imageUrl = data.output_urls[0];
          } else if (data.imageUrl) {
            // Fallback for old format
            imageUrl = data.imageUrl;
          } else {
            throw new Error('No output images received from PhotAI API');
          }

          if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
            markboardRef.value.setImageOnMarkboard(imageUrl)
          }
          // Turn off mask mode after generation
          if (
            markboardRef.value &&
            typeof markboardRef.value.toggleMaskMode === 'function' &&
            markboardRef.value.maskMode
          ) {
            maskModeOn = markboardRef.value.toggleMaskMode()
            maskModeText.value = maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
          }
          toggleLoading() // Turn loading off
        })
        .catch((err) => {
          if (err.message !== 'AI Fill failed') {
            alert('AI Fill failed: ' + err.message)
          }
          // Also turn off mask mode on error
          if (
            markboardRef.value &&
            typeof markboardRef.value.toggleMaskMode === 'function' &&
            markboardRef.value.maskMode
          ) {
            maskModeOn = markboardRef.value.toggleMaskMode()
            maskModeText.value = maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
          }
          toggleLoading() // Turn loading off
        })
    })
  })
}

function handleDownloadMarkboard() {
  if (markboardRef.value) {
    markboardRef.value.getJpegBlob().then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'markboard.jpg'
        link.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to download Markboard.')
      }
    })
  }
}

function handleDownloadMaskboard() {
  if (markboardRef.value && markboardRef.value.maskMode) {
    markboardRef.value.getMaskPngBlob().then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'maskboard.png'
        link.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to download Maskboard.')
      }
    })
  } else {
    alert('Mask mode is not enabled.')
  }
}

const markboardFileInput = ref(null)
const chosenFileName = ref('No file chosen')

function updateFileName(event) {
  const file = event.target.files[0]
  chosenFileName.value = file ? file.name : 'No file chosen'
}

function handleUploadToMarkboard(event) {
  event.preventDefault()
  markboardUploadError.value = '' // Clear previous error
  const file = markboardFileInput.value?.files?.[0]
  if (!file) {
    markboardUploadError.value = 'Please select a file.'
    return
  }
  if (!file.type.startsWith('image/')) {
    markboardUploadError.value = 'Please select an image file.'
    return
  }
  if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
    markboardRef.value.setImageOnMarkboard(file)
  }
}

const loading = ref(false)

function toggleLoading() {
  loading.value = !loading.value
}

const color = ref('#000000')

function handleColorChange(newColor) {
  console.log('Color changed to:', newColor)
  color.value = newColor
}

function handleRoomJoin() {
  roomName.value = roomInput.value.trim()
  console.log('Joining room:', roomName.value)
  joinRoom(roomName.value)
  requestMarkboard()
  roomInput.value = ''
}

function handleClearMarkboard() {
  if (window.confirm('Are you sure you want to clear the markboard?')) {
    if (markboardRef.value && typeof markboardRef.value.clearMarkboard === 'function') {
      markboardRef.value.clearMarkboard()
    }
  }
}

const markboardUploadError = ref('')
</script>

<template>
  <!-- Success page -->
  <SuccessPage v-if="currentRoute === 'success'" />

  <!-- Cancel page -->
  <CancelPage v-else-if="currentRoute === 'cancel'" />

  <!-- Loading state -->
  <div v-else-if="isLoading" class="loading-container">
    <h2>Loading...</h2>
  </div>

  <!-- Login page for unauthenticated users -->
  <div v-else-if="showLoginPage" class="login-container">
    <div class="login-content">
      <h1>Welcome to Mark-It</h1>
      <p>Please sign in to access the application</p>
      <button @click="handleGoogleLogin" class="google-login-btn">
        Sign in with Google
      </button>
    </div>
  </div>

  <!-- Paywall for authenticated but unsubscribed users -->
  <div v-else-if="showPaywall" class="paywall-container">
    <div class="paywall-content">
      <h1>Subscribe to Mark-It</h1>
      <p>To access all features of Mark-It, please subscribe to our service.</p>
      <PaymentComponent @success="handleSubscriptionSuccess" @cancel="handleSubscriptionCancel" />
      <button @click="handleSignout" class="signout-btn">Sign Out</button>
    </div>
  </div>

  <!-- Main application for authenticated and subscribed users -->
  <div v-else>
    <TopBar @signout="handleSignout" @unsubscribe="handleUnsubscribe" />
    <div class="main">
      <main>
        <div class="room-join">
          <h1>Current Room Code: {{ roomName }}</h1>
          <p>Join a collaborative room:</p>
          <form @submit.prevent="handleRoomJoin(roomInput)">
            <input
              type="text"
              v-model="roomInput"
              placeholder="Enter room name"
              required
              class="room-input"
            />
            <button type="submit" class="room-join-btn">Join/Create Room</button>
          </form>
        </div>
        <div class="markboard-title">
          <h1>Markboard</h1>
          <p>Click and drag to draw</p>
        </div>
        <Markboard ref="markboardRef" :color="color" />
        <!-- I wanted to put the loading in the Markboard, but it kept resetting the maskboard -->
        <div v-if="loading" class="loading-title">Loading...</div>
        <div class="markboard-controls">
          <div class="wrapper">
            <ToolBar @color-change="handleColorChange" @join-room="handleRoomJoin"/>
            <div class="markboard-actions">
              <form @submit="handleUploadToMarkboard" class="upload-form">
                <label class="file-label">
                  <input type="file" ref="markboardFileInput" @change="updateFileName" />
                  <span class="file-label-text">Choose File</span>
                </label>
                <span class="file-name">{{ chosenFileName }}</span>
                <button type="submit">Upload to Markboard</button>
              </form>
              <span v-if="markboardUploadError" class="input-error">{{ markboardUploadError }}</span>
              <div class="markboard-actions-bottom">
                <button @click="handleDownloadMarkboard">Download Markboard</button>
                <button @click="handleClearMarkboard">Clear Markboard</button>
              </div>
            </div>
          </div>
        </div>
        <div class="generative-fill">
          <h2>AI Text To Image</h2>
          <p>Powered by Clipdrop.co</p>
          <span class="how-to-use-tooltip">
            How to use
            <span class="how-to-use-popup">
              <strong>Instructions:</strong><br>
              1. Enter a prompt describing what you want.<br>
              2. Click <b>Generate</b>.<br>
              3. Wait for the AI to fill the drawing board.<br>
            </span>
          </span>
          <div class="wrapper generative-fill-actions">
            <div>
              <form @submit.prevent="handleTextToImage" class="prompt-form">
                <input type="text" placeholder="Enter prompt" v-model="aiPrompt" />
                <button type="submit">Generate</button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <br />
      <br />
      <br />
    </div>
    <footer>
      <div class="footer-content">
        <h1>Credits:</h1>
        <ul>
          <li>
            The Stripe structure and code in payment_router.js, PaymentComponent.vue,
            SuccessPage.vue, and CancelPage.vue obtained from:
            <a href="https://docs.stripe.com/billing/quickstart?lang=node"
              >Stripe Checkout</a
            >
            and
            <a href="https://docs.stripe.com/error-handling"
              >Stripe Error Handling Documentation</a
            >
          </li>
          <li>
            GitHub Copilot inline code suggestions were used to help complete the code.
          </li>
        </ul>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Loading, Login, and Paywall Styles */
.loading-container,
.login-container,
.paywall-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8fafc;
}

.login-content,
.paywall-content {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  text-align: center;
  max-width: 500px;
  width: 90%;
  border: 1px solid #e2e8f0;
}

.login-content h1,
.paywall-content h1 {
  color: #1976d2;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 600;
}

.login-content p,
.paywall-content p {
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.google-login-btn,
.signout-btn {
  background: #1976d2;
  color: white;
  border: 1px solid #1976d2;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  margin: 0.5rem;
}

.google-login-btn:hover {
  background: #fff;
  color: #1976d2;
}

.signout-btn {
  background: #64748b;
  border-color: #64748b;
  margin-top: 1rem;
}

.signout-btn:hover {
  background: #fff;
  color: #64748b;
}

.loading-container h2 {
  color: #1976d2;
  font-size: 2rem;
}

header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    display: flex;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}

.main {
  padding-top: 64px;
  position: relative;
}

.markboard-title {
  text-align: center;
  margin-bottom: 16px;
}

.markboard-controls {
  display: flex;
  margin-top: 16px;
  margin-bottom: 16px;
  max-width: 1024px;   /* Match markboard width */
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.markboard-controls .wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.markboard-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  margin-left: auto;
}

.markboard-actions-bottom {
  display: flex;
  gap: 12px;
}

.markboard-actions form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.markboard-actions button,
.markboard-actions form button {
  font-size: 1rem;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.markboard-actions button:hover,
.markboard-actions form button:hover {
  background: #fff;
  color: #1976d2;
}

.file-label {
  display: inline-block;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: #1976d2;
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 1rem;
  border: 1px solid #1976d2;
  transition: background 0.15s, color 0.15s;
}

.file-label:hover {
  background: #fff;
  color: #1976d2;
}

.file-label input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-label-text {
  pointer-events: none;
}

.file-name {
  font-size: 0.95rem;
  color: #333;
  margin-left: 4px;
  min-width: 100px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.loading-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-family: 'comic sans ms', sans-serif;
  color: #000000;
  z-index: 4;
}

.toolbar-colours {
  display: flex;
  align-items: center; /* Vertically center children */
  gap: 12px;           /* Optional: space between items */
}

.input-error {
  color: #d32f2f;
  font-size: 0.95em;
  margin-left: 8px;
  margin-top: 2px;
  display: inline-block;
  vertical-align: middle;
}

.generative-fill {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  padding: 32px 24px 24px 24px;
  margin: 32px auto 24px auto;
  max-width: 1024px;
  width: 1024px;
}

.generative-fill h2 {
  margin-top: 0;
  font-size: 1.6rem;
  color: #1976d2;
}

.generative-fill-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start; /* Align items to the left */
  gap: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-top: 18px;
  width: 100%;
  box-sizing: border-box;
}

.generative-fill-actions .mask-btn {
  margin: 0;
  font-size: 1rem;
  padding: 8px 18px;
  border-radius: 6px;
  border: 1.5px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.generative-fill-actions .mask-btn:hover {
  background: #fff;
  color: #1976d2;
}

.generative-fill-actions input[type="text"] {
  font-size: 1rem;
  padding: 7px 12px;
  border-radius: 6px;
  border: 1.5px solid #bdbdbd;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  min-width: 600px;
  max-width: 800px;
  box-sizing: border-box;
  flex: 1 1 auto;
}

.generative-fill-actions input[type="text"]:focus {
  border-color: #1976d2;
}

.generative-fill-actions button[type="submit"] {
  font-size: 1rem;
  padding: 8px 18px;
  border-radius: 6px;
  border: 1.5px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  margin-left: 8px;
}

.generative-fill-actions button[type="submit"]:hover {
  background: #fff;
  color: #1976d2;
}

.prompt-form {
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  width: 100%;
}

.how-to-use-tooltip {
  position: relative;
  display: inline-block;
  cursor: pointer;
  color: #1976d2;
  font-weight: bold;
}

.how-to-use-popup {
  display: none;
  position: absolute;
  left: 50%;
  top: 120%;
  transform: translateX(-20%);
  background: #fff;
  color: #222;
  border: 1.5px solid #1976d2;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 16px 20px;
  min-width: 600px;   /* Increased from 260px */
  max-width: 800px;   /* Optional: prevents it from getting too wide */
  width: 100%;        /* Ensures it fills up to max-width */
  z-index: 10;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: normal;
}

.how-to-use-tooltip:hover .how-to-use-popup,
.how-to-use-tooltip:focus .how-to-use-popup {
  display: block;
}

footer {
  flex-shrink: 0;
  background: #f8fafc;
  border-top: 1px solid #ddd;
  padding: 24px 32px 16px 32px;
  font-size: 1rem;
  color: #333;
}

.footer-content {
  max-width: 1024px;
  margin: 0 auto;
  width: 100%;
}

.footer-content h1 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: #1976d2;
}

.footer-content ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.footer-content ul li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.footer-content ul li a {
  color: #1976d2;
  text-decoration: none;
}

.footer-content ul li a:hover {
  text-decoration: underline;
}

.room-join {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  padding: 32px 24px 24px 24px;
  margin: 32px auto 24px auto;
  max-width: 1024px;
  width: 1024px;
  border: none;
}

.room-join h1 {
  color: #1976d2;
  margin-bottom: 8px;
  font-size: 1.6rem;
  font-weight: 600;
}

.room-join p {
  color: #64748b;
  margin-bottom: 16px;
  font-size: 1rem;
}

.room-join form {
  display: flex;
  gap: 12px;
}

.room-input {
  font-size: 1rem;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1.5px solid #bdbdbd;
  outline: none;
  transition: border-color 0.15s;
  min-width: 180px;
  max-width: 240px;
}

.room-input:focus {
  border-color: #1976d2;
}

.room-join-btn {
  font-size: 1rem;
  padding: 8px 18px;
  border-radius: 6px;
  border: 1.5px solid #1976d2;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.room-join-btn:hover {
  background: #fff;
  color: #1976d2;
}
</style>
