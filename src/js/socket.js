import { reactive } from 'vue'
import { io } from 'socket.io-client'
export const state = reactive({
  userId: Math.floor(Math.random() * 999_999_999_999) + 1,
  connected: false,
  paintBuffer: [],
})

const URL = 'http://134.122.34.179:3000'

export const socket = io(URL)

socket.on('connect', () => {
  state.connected = true
})

socket.on('disconnect', () => {
  state.connected = false
})

socket.on('paint', (paint) => {
  state.paintBuffer.push(paint)
})

export function sendPaint(paint) {
  socket.emit('paint', paint)
}

export function sendMarkboard(markboard) {
  socket.emit('markboard', markboard)
}

export function requestMarkboard() {
  socket.emit('markboardReq', true)
}
