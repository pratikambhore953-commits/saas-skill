import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import healthRoutes, { setIo } from "./routes/health.routes";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// ─── HTTP Server + Socket.io ─────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Provide the io instance to the health routes module
setIo(io);

// ─── CORS Middleware (before all routes) ─────────────────────────────────────
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Routes (public — no auth) ────────────────────────────────────────
app.use("/api/health", healthRoutes);

// ─── Socket.io Event Handlers ────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  const userId = socket.handshake.auth.userId as string | undefined;
  if (userId) {
    void socket.join(`user:${userId}`);
  }

  socket.on("join_room", (roomId: string) => {
    void socket.join(roomId);
  });

  socket.on("leave_room", (roomId: string) => {
    void socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export { io };
export default app;
