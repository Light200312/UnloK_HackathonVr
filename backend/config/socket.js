import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://unlok-lkr3.onrender.com",
    ],
  },
});

// used to store online users { userId: socketId }
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // ✅ Always join global room
  socket.join("global");

  // ✅ Emit online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ --- NEW CODE (join clan rooms dynamically) ---
  socket.on("joinClanRoom", (roomId) => {
    console.log(`🟢 User ${socket.id} joined clan room: ${roomId}`);
    socket.join(roomId);
  });

  // Optional: Leave clan room (when switching clans)
  socket.on("leaveClanRoom", (roomId) => {
    console.log(`🔴 User ${socket.id} left clan room: ${roomId}`);
    socket.leave(roomId);
  });

  // ✅ Handle disconnects
  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
