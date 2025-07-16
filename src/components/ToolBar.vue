<template>
  <div class="toolbar">
    <div class="toolbar-colours">
      <div class="color-picker-wrapper">
        <input type="color" id="colour" v-model="colour" @change="watch" class="color-picker" />
      </div>
      <div class="color-divider"></div>
      <div class="preset-colours">
        <button
          v-for="c in preSetColours"
          :key="c"
          :style="{ backgroundColor: c }"
          @click="changeColor(c)"
        ></button>
      </div>
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
.toolbar-colours {
  display: flex;
  align-items: center;
}

.color-picker-wrapper {
  display: inline-block;
  position: relative;
}

.color-divider {
  width: 2px;
  height: 48px;
  background: #bbb;
  margin: 0 16px;
  border-radius: 2px;
}

.preset-colours {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 8px;
}

button {
  width: 32px;
  height: 32px;
  border: 2px solid #ccc;
  border-radius: 30%;
  margin: 0;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  outline: none;
  display: inline-block;
  position: relative;
}

button[style*="#FFFFFF"] {
  border: 2px solid #888; /* Make white button visible */
}

button:hover, button:focus {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.18);
  border-color: #333;
}

.colour {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
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
.color-picker {
  width: 60px;
  height: 60px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  outline: none;
}
</style>
