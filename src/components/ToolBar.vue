<template>
  <div class="toolbar">
    <div class="toolbar-colours">
      <div class="color-picker-wrapper">
        <input
          type="color"
          id="colour"
          v-model="colour"
          @change="watch"
          class="color-picker"
          :style="{ backgroundColor: colour }"
        />
      </div>
      <div class="color-divider"></div>
      <div class="preset-colours">
        <button
          v-for="(c, index) in preSetColours"
          :key="c"
          :style="{ backgroundColor: c }"
          @click="changeColor(c, index)"
        ></button>
      </div>
    </div>
    <div class="toolbar-width">
      <label for="width">Width:</label>
      <input
        type="range"
        id="width"
        v-model="width"
        min="1"
        max="20"
        step="1"
        class="width-slider"
        @input="updateWidth(width)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'

const preSetColours = ref([
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#7F00FF',
  '#FFFFFF',
  '#000000',
])
const preSetIndex = ref(0)
const colour = ref(preSetColours.value[preSetIndex.value])
const widths = ref(Array(preSetColours.value.length).fill(4))
const width = ref(widths.value[0])

const props = defineProps({
  color: {
    type: String,
    default: '#000000',
  },
})

const emit = defineEmits(['colorChange', 'widthChange'])
const changeColor = (newColor, index) => {
  colour.value = newColor
  emit('colorChange', newColor)
  preSetIndex.value = index
  width.value = widths.value[index]
  emit('widthChange', width.value)
}
const watch = () => {
  emit('colorChange', colour.value)
  preSetColours.value[preSetIndex.value] = colour.value
}

const updateWidth = (newWidth) => {
  widths.value[preSetIndex.value] = newWidth
  emit('widthChange', newWidth)
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    border-color 0.15s;
  outline: none;
  display: inline-block;
  position: relative;
}

button[style*='#FFFFFF'] {
  border: 2px solid #888; /* Make white button visible */
}

button:hover,
button:focus {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  border-color: #333;
}

.colour {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  -webkit-appearance: none;
  appearance: none;
}

.width-slider {
  width: 200px;
  margin: 0 0 0 10px;
}

.toolbar-width {
  display: flex;
  align-items: center;
  margin-left: 20px;
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
