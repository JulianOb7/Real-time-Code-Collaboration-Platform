import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const users = new Map();

io.on("connection", (socket: Socket) => {
  const userData = { id: socket.id, name: `User-${socket.id.substring(0, 4)}` };
  users.set(socket.id, userData);

  io.emit("users-list", Array.from(users.values()));

  socket.on("language-change", (newLang: string) => {
    socket.broadcast.emit("language-change", newLang);
  });

  socket.on("change-name", (newName: string) => {
    const user = users.get(socket.id);
    if (user) {
      user.name = newName;
      users.set(socket.id, user);
      io.emit("users-list", Array.from(users.values()));
    }
  });

  socket.on("code-change", (data: string) => {
    socket.broadcast.emit("code-change", data);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("users-list", Array.from(users.values()));
  });
});

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
