<script setup>
import Canvas from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'

// For testing onlu (remove later)
function signOut() {
  fetch('http://localhost:3001/api/users/signout', {
    credentials: 'include',
  }).then(() => {
    window.location.reload()
  })
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
