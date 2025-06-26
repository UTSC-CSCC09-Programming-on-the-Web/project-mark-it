<script setup>
import Canvas from './components/Canvas.vue'
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
    <Canvas />
  </main>
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
</style>
