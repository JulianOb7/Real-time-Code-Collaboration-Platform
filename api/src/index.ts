import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("code-change", (delta) => {
    socket.broadcast.emit("receive-change", delta);
  });

  socket.on("execute-code", async (code) => {});
});

httpServer.listen(3001, () => {
  console.log("Server running on port 3001");
});
