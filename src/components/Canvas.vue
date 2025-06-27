<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const markboard = ref()
let context = null

const drawing = ref(false)
const colour = ref('#000000')
const width = ref(4)

onMounted(() => {
  const canvasElement = markboard.value
  if (!canvasElement) {
    return
  }
  context = canvasElement.getContext('2d')
  if (!context) return

  canvasElement.width = 1920
  canvasElement.height = 1080

  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvasElement.width, canvasElement.height)
})

onUnmounted(() => {
  context = null
})

const startDrawing = (e) => {
  if (!context) return

  drawing.value = true

  context.beginPath()
  context.moveTo(e.offsetX, e.offsetY)
}

const paint = (e) => {
  if (!drawing.value || !context) return

  context.strokeStyle = colour.value
  context.lineWidth = width.value

  context.lineTo(e.offsetX, e.offsetY)
  context.stroke()
}

const stopDrawing = () => {
  if (!drawing.value || !context) return

  drawing.value = false
  context.closePath()
}
</script>

<template>
  <div class="markboard-container">
    <canvas
      ref="markboard"
      @mousedown="startDrawing"
      @mousemove="paint"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
    ></canvas>
  </div>
</template>

<style scoped>
.markboard-container {
  width: 100%;
  height: 100%;
}

canvas {
  border: 2px solid #000;
  border-radius: 16px;
  cursor: crosshair;
}
</style>
