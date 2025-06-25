<script setup>
import Canvas from './components/Canvas.vue'
import ToolBar from './components/ToolBar.vue'
</script>

<template>
  <header>
    <div class="wrapper">
      <ToolBar />
    </div>
  </header>

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
