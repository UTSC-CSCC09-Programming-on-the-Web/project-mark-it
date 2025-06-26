<script setup>
import Canvas from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'
import { ref } from 'vue'

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
      alert("Your googleId: " + data.googleId)
    })
}

// File upload logic
const fileInput = ref(null)

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
    } else {
      alert('Upload failed: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    alert('Upload failed: ' + err.message)
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
    <label for="colour">Download File:</label>
  </div>
  <div>
    <label for="colour">Share File:</label>
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
