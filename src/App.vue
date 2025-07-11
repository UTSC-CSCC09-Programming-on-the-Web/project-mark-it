<script setup>
import Markboard from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'
import { ref, onMounted } from 'vue'

// For testing onlu (remove later)
function signOut() {
  fetch('http://localhost:3001/api/users/signout', {
    credentials: 'include',
  }).then(() => {
    window.location.reload()
  })
}

// For testing only (remove later)
// This function fetches the current user's data from the server
// and logs it to the console.
function testMe() {
  fetch('http://localhost:3001/api/users/me', {
    credentials: 'include',
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
      alert('Your googleId: ' + data.googleId)
    })
}

// File upload logic
const fileInput = ref(null)
const userFiles = ref([]) // Store user's files
const selectedFileId = ref('')
const shareGoogleId = ref('')

// Fetch user's files on mount
async function fetchUserFiles() {
  try {
    const res = await fetch('http://localhost:3001/api/files/', {
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

onMounted(fetchUserFiles)

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
    const res = await fetch('http://localhost:3001/api/files/', {
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
  const url = `http://localhost:3001/api/files/download/${selectedFileId.value}`
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
    const res = await fetch(`http://localhost:3001/api/files/share/${selectedFileId.value}`, {
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
    maskModeText.value =
      maskModeOn ? 'Exit Mask Mode' : 'Mask Mode'
  }
}

const aiPrompt = ref('')

function handleGenerativeFill(event) {
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

      fetch('http://localhost:3001/api/ai_fill/', {
        method: 'POST',
        body: formData,
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
          if (markboardRef.value && typeof markboardRef.value.toggleMaskMode === 'function' && markboardRef.value.maskMode) {
            markboardRef.value.toggleMaskMode()
            maskModeText.value = 'Mask Mode'
          }
          toggleLoading() // Turn loading off
        })
        .catch((err) => {
          if (err.message !== 'AI Fill failed') {
            alert('AI Fill failed: ' + err.message)
          }
          // Also turn off mask mode on error
          if (markboardRef.value && typeof markboardRef.value.toggleMaskMode === 'function' && markboardRef.value.maskMode) {
            markboardRef.value.toggleMaskMode()
            maskModeText.value = 'Mask Mode'
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

const testImageUrl = ref('')

function testSetImage(event) {
  event.preventDefault()
  if (!testImageUrl.value) {
    alert('Please enter an image URL.')
    return
  }
  const img = new Image()
  img.crossOrigin = 'anonymous' // Allow loading from external sources
  img.src = testImageUrl.value
  img.onload = () => {
    if (markboardRef.value && typeof markboardRef.value.setImageOnMarkboard === 'function') {
      markboardRef.value.setImageOnMarkboard(img)
    }
  }
  img.onerror = () => {
    alert('Failed to load image.')
  }
}

const loading = ref(false)

function toggleLoading() {
  loading.value = !loading.value
}
</script>

<template>
  <header>
    <div class="wrapper">
      <ToolBar />
    </div>
  </header>

  <!-- For testing only (remove later) -->
  <div>
    <a href="http://localhost:3001/auth/google">
      <button id="oauth">Sign In With Google</button>
    </a>
    <button @click="signOut">Sign Out</button>
    <button @click="testMe">Test (googleId)</button>
  </div>
  <div>
    <form @submit="uploadFile">
      <label for="upload">Upload File:</label>
      <input type="file" id="upload" ref="fileInput" />
      <button type="submit">Upload</button>
    </form>
  </div>
  <div>
    <form @submit="handleDownload">
      <label for="download">Download File:</label>
      <select name="download" id="download" v-model="selectedFileId">
        <option value="">Select a file</option>
        <option v-for="file in userFiles" :key="file.id" :value="file.id">
          {{ file.file.originalname }}
        </option>
      </select>
      <button type="submit">Download</button>
    </form>
  </div>
  <div>
    <form @submit="handleShare">
      <label for="share">Share File:</label>
      <select name="share" id="share" v-model="selectedFileId">
        <option value="">Select a file</option>
        <option v-for="file in userFiles" :key="file.id" :value="file.id">
          {{ file.file.originalname }}
        </option>
      </select>
      <input type="text" placeholder="Enter googleId to share with" v-model="shareGoogleId" />
      <button type="submit">Share</button>
    </form>
  </div>

  <main>
    <Markboard ref="markboardRef" />
    <!-- I wanted to put the loading in the Markboard, but it kept resetting the maskboard -->
    <div v-if="loading" class="loading-title">Loading...</div>
    <button
      class="mask-btn"
      @click="handleToggleMaskMode"
      style="margin: 24px auto 0 auto; display: block;"
    >
      {{ maskModeText }}
    </button>
    <div>
      <form @submit.prevent="handleGenerativeFill" v-if="maskModeOn">
        <input type="text" placeholder="Enter prompt" v-model="aiPrompt" />
        <button type="submit">Generate</button>
      </form>
    </div>
    <br />
    <button @click="handleDownloadMarkboard">Download Markboard</button>
    <button @click="handleDownloadMaskboard">Download Maskboard</button>
    <div>
      <form @submit.prevent="testSetImage">
        <input type="text" placeholder="Set Image URL" v-model="testImageUrl" />
        <button type="submit">Set Image (for testing)</button>
      </form>
    </div>
  </main>
  <br />
  <br />
  <br />
</template>

<style scoped>
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
</style>
