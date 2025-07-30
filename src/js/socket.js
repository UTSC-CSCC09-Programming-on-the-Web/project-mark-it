import { reactive } from 'vue'
import { io } from 'socket.io-client'
export const state = reactive({
  userId: Math.floor(Math.random() * 999_999_999_999) + 1,
  connected: false,
  paintBuffer: [],
  currentRoom: '',
})

const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const socket = io(URL)

socket.on('connect', () => {
  state.connected = true
  socket.emit('joinRoom', state.currentRoom)
})

socket.on('disconnect', () => {
  state.connected = false
})

socket.on('paint', (paint) => {
  state.paintBuffer.push(paint)
})

export function sendPaint(paint) {
  socket.emit('paint', { room: state.currentRoom, paint })
}

export function sendMarkboard(markboard) {
  socket.emit('markboard', { room: state.currentRoom, markboard })
}

export function requestMarkboard() {
  socket.emit('markboardReq', { room: state.currentRoom })
}

export function joinRoom(room) {
  socket.emit('leaveRoom', state.currentRoom)
  state.currentRoom = room
  socket.emit('joinRoom', room)
}
