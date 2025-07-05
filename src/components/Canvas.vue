<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { socket, state, sendPaint } from '@/js/socket.js'

const PAINT_STATUS = {
  0: 'start',
  1: 'drawing',
  2: 'stopped'
}

const markboard = ref()
let context = null

let connectedContext = null;

const drawing = ref(false)
const colour = ref('#000000')
const width = ref(4)

onMounted(() => {
  const canvasElement = markboard.value
  if (!canvasElement) {
    return
  }
  context = canvasElement.getContext('2d')
  connectedContext = canvasElement.getContext('2d')
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

  sendPaint({
    status: PAINT_STATUS[0],
    data: {
      x: e.offsetX,
      y: e.offsetY,
      colour: colour.value,
      width: width.value
    },
    userId: state.userId,
  })
}

const paint = (e) => {
  if (!drawing.value || !context) return

  context.strokeStyle = colour.value
  context.lineWidth = width.value

  context.lineTo(e.offsetX, e.offsetY)
  context.stroke()

  sendPaint({
    status: PAINT_STATUS[1],
    data: {
      x: e.offsetX,
      y: e.offsetY,
      colour: colour.value,
      width: width.value
    },
    userId: state.userId,
  })
}

const stopDrawing = () => {
  if (!drawing.value || !context) return

  drawing.value = false
  context.closePath()

  sendPaint({
    status: PAINT_STATUS[2],
    data: {
      x: null,
      y: null,
      colour: colour.value,
      width: width.value
    },
    userId: state.userId,
  })
}

socket.on('paint', (paint) => {
  console.log('Received paint data:', paint)
  if (!connectedContext) return
  if (paint.status === PAINT_STATUS[0]) {
    connectedContext.beginPath()
    connectedContext.moveTo(paint.data.x, paint.data.y)
  } else if (paint.status === PAINT_STATUS[2]) {
    connectedContext.closePath()
    return
  }

  connectedContext.strokeStyle = paint.data.colour
  connectedContext.lineWidth = paint.data.width
  connectedContext.lineTo(paint.data.x, paint.data.y)
  connectedContext.stroke()
})
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
