<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { socket, state, sendPaint } from '@/js/socket.js'

const PAINT_STATUS = {
  0: 'start',
  1: 'drawing',
  2: 'stopped'
}

const canvaswidth = 1080;
const canvasheight = 720;

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

  canvasElement.width = canvaswidth
  canvasElement.height = canvasheight

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

function getJpegBlob() {
  const canvasElement = markboard.value
  if (!canvasElement) return null
  return new Promise((resolve) => {
    canvasElement.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.92 // quality
    )
  })
}

const maskMode = ref(false)
const maskboard = ref()
let maskContext = null
const maskDrawing = ref(false)
const maskBrushSize = 40 // Large brush for mask

function toggleMaskMode() {
  maskMode.value = !maskMode.value
  return maskMode.value
}

function startMaskDrawing(e) {
  if (!maskMode.value || !maskContext) return
  maskDrawing.value = true
  drawMask(e)
}

function drawMask(e) {
  if (!maskMode.value || !maskDrawing.value || !maskContext) return
  // Use offsetX/Y for correct coordinates
  const x = e.offsetX
  const y = e.offsetY
  maskContext.globalCompositeOperation = 'source-over'
  maskContext.beginPath()
  maskContext.arc(x, y, maskBrushSize / 2, 0, 2 * Math.PI)
  maskContext.fillStyle = '#fff'
  maskContext.fill()
}

function stopMaskDrawing() {
  maskDrawing.value = false
}

// Export mask as PNG
function getMaskPngBlob() {
  if (!maskboard.value) return null
  return new Promise((resolve) => {
    maskboard.value.toBlob(
      (blob) => resolve(blob),
      'image/png'
    )
  })
}

function onMaskboardMounted(el) {
  maskboard.value = el
  if (el) {
    el.width = canvaswidth
    el.height = canvasheight
    maskContext = el.getContext('2d')
    maskContext.clearRect(0, 0, canvaswidth, canvasheight)
    maskContext.globalCompositeOperation = 'source-over'
    maskContext.fillStyle = '#000'
    maskContext.fillRect(0, 0, canvaswidth, canvasheight)
  }
}
// Helper to draw the image once loaded
function draw(img) {
  // Optionally clear the canvas first:
  context.clearRect(0, 0, canvaswidth, canvasheight)
  // Draw the image, scaled to fit the canvas
  context.drawImage(img, 0, 0, canvaswidth, canvasheight)
}

function setImageOnMarkboard(imageSource) {
  const canvasElement = markboard.value
  if (!canvasElement || !context) return

  

  // If it's a string, treat as data URL or URL.
  // This may not actually be needed.
  if (typeof imageSource === 'string') {
    const img = new window.Image()
    img.onload = () => draw(img)
    img.src = imageSource
  } else if (imageSource instanceof Blob || imageSource instanceof File) {
    const img = new window.Image()
    img.onload = () => {
      draw(img)
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(imageSource)
  } else if (imageSource instanceof HTMLImageElement) {
    draw(imageSource)
  } else {
    console.warn('Unsupported image source for setImageOnMarkboard')
  }
}

defineExpose({ getJpegBlob, getMaskPngBlob, maskMode, toggleMaskMode, setImageOnMarkboard })
</script>

<template>
  <div class="markboard-container">
    <canvas
      ref="markboard"
      @mousedown="startDrawing"
      @mousemove="paint"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      :width="canvaswidth"
      :height="canvasheight"
      class="main-canvas"
    ></canvas>
    <canvas
      v-if="maskMode"
      :ref="onMaskboardMounted"
      class="mask-overlay"
      :width="canvaswidth"
      :height="canvasheight"
      @mousedown="startMaskDrawing"
      @mousemove="drawMask"
      @mouseup="stopMaskDrawing"
      @mouseleave="stopMaskDrawing"
    ></canvas>
  </div>
</template>

<style scoped>
.markboard-container {
  width: 1080px;
  height: 720px;
  position: relative;
  margin: 0 auto;
}
.main-canvas,
.mask-overlay {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid #000;
  border-radius: 16px;
  cursor: crosshair;
  width: 1080px;
  height: 720px;
  display: block;
}
.main-canvas {
  z-index: 1;
}
.mask-overlay {
  z-index: 2;
  pointer-events: auto;
  opacity: 0.2; /* 20% opacity */
}
.mask-btn {
  position: absolute;
  z-index: 3;
  top: 10px;
  left: 10px;
  background: #222;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  opacity: 0.8;
}
</style>
