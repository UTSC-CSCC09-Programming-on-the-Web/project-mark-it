<template>
  <div class="toolbar">
    <div class="toolbar-colours">
      <label for="colour">Colour:</label>
      <input type="color" id="colour" v-model="colour" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

const colour = ref('#000000')
const width = ref(5)
</script>

<style scoped>
.toolbar {
}
</style>
