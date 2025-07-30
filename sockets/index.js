import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_DOMAIN,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('paint', ({ room, paint }) => {
    console.log(`paint in room ${room}:`, paint)
    if (room !== '') {
      socket.to(room).emit('paint', paint)
    }
  })
  socket.on('markboard', ({ room, markboard }) => {
    console.log(`markboard in room ${room}:`, markboard)
    if (room !== '') {
      socket.to(room).emit('markboard', markboard)
    }
  })
  socket.on('markboardReq', ({ room }) => {
    console.log(`markboard requested in room ${room}`)
    if (room !== '') {
      socket.to(room).emit('markboardReq', true)
    }
  })
  socket.on('joinRoom', (room) => {
    if (!room || typeof room !== 'string' || room.trim() === '') {
      console.log('Invalid room name provided');
      return;
    }
    const sanitizedRoom = room.trim();
    console.log(`User joined room: ${sanitizedRoom}`);
    socket.join(sanitizedRoom);
  });
  socket.on('leaveRoom', (room) => {
    if (!room || typeof room !== 'string' || room.trim() === '') {
      console.log('Invalid room name for leaving');
      return;
    }
    const sanitizedRoom = room.trim();
    console.log(`User left room: ${sanitizedRoom}`);
    socket.leave(sanitizedRoom);
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
