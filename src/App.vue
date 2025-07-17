<script setup>
import Markboard from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'
import TopBar from './components/TopBar.vue'
import { ref, onMounted } from 'vue'


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

function handleRoomJoin(roomName) {
  console.log('Joining room:', roomName)
  
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
  <TopBar />
  <div class="main">
    <main>
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
      <hr />
      <div class="generative-fill">
        <h2>AI Generative Fill</h2>
        <p>Use AI to fill in areas of your drawing.</p>
        <p>Enable Mask Mode to select areas for AI generation.</p>
        <p>Powered by Clipdrop.co</p>
        <p>How to use</p>
        <div class="wrapper generative-fill-actions">
          <button
            class="mask-btn"
            @click="handleToggleMaskMode"
          >
            {{ maskModeText }}
          </button>
          <div>
            <form @submit.prevent="handleGenerativeFill" class="prompt-form">
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
  max-width: 1080px;
  width: 1080px;
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
</style>
