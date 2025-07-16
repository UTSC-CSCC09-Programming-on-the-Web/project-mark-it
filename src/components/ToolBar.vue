<template>
  <div class="toolbar">
    <div class="toolbar-colours">
      <label for="colour">Colour:</label>
      <button
        v-for="c in preSetColours"
        :key="c"
        :style="{ backgroundColor: c }"
        @click="changeColor(c)"
      ></button>
      <input type="color" id="colour" v-model="colour" @change="watch" />
    </div>
    <div class="room-info">
      <label for="room">Room:</label>
      <input
        type="text"
        id="room"
        class="room-input"
        v-model="room"
        @keyup.enter="$emit('joinRoom', room)"
        placeholder="Enter room name"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'

const preSetColours = ref(['#FF0000', '#FF8F00', '#FFFF00', '#00FF00', '#0000FF', '#FF00FF', '#FFFFFF', '#000000'])
const colour = ref('#000000')
const props = defineProps({
  color: {
    type: String,
    default: '#000000',
  },
})

const room = ref('')

const emit = defineEmits(['colorChange'])
const changeColor = (newColor) => {
  colour.value = newColor
  emit('colorChange', newColor)
}
const watch = () => {
  emit('colorChange', colour.value)
}
</script>

<style scoped>
button {
  width: 30px;
  height: 30px;
  border: 2px solid #fff;
  cursor: pointer;
}

.room-info {
  display: flex;
  align-items: center;
}
.room-input {
  margin-left: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
}
</style>
