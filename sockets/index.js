import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://dannyyang.me",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('paint', (msg) => {
    console.log('paint: ' + msg);
    socket.broadcast.emit('paint', msg);
  });
  socket.on('markboard', (msg) => {
    console.log('markboard: ' + msg);
    socket.broadcast.emit('markboard', msg);
  });
  socket.on('markboardReq', () => {
    console.log('markboard requested');
    // Ask other clients to send their markboards
    socket.broadcast.emit('markboardReq', true);
  });
});

server.listen(3000, () => {
  console.log('server running at http://134.122.34.179:3000');
});
