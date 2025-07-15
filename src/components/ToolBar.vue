<template>
  <div class="toolbar">
    <div class="toolbar-colours">
      <label for="colour">Colour:</label>
      <button
        v-for="c in preSetColours"
        :key="c"
        :style="{ backgroundColor: c }"
        @click="colour = c"
      ></button>
      <input type="color" id="colour" v-model="colour" @input="watch"/>
    </div>
  </div>
</template>

<script>
import { ref, defineEmits } from 'vue'

export default {
  setup() {
    const emit = defineEmits(['colourChange'])
    const preSetColours = ref(['#FF0000', '#0000FF', '#00FF00', '#000000', '#FFFFFF'])
    const colour = ref('#000000')

    return {
      preSetColours,
      colour,
    }
  },
}

const watch = (newValue) => {
  emit('colourChange', newValue)
}
</script>

<style scoped>
.toolbar {
}
</style>
