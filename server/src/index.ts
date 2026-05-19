import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { contactsRouter } from './routes/contacts.js';
import { messagesRouter } from './routes/messages.js';
import { groupsRouter } from './routes/groups.js';
import { agoraRouter } from './routes/agora.js';
import { registerSocketHandlers } from './socket/index.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Global middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/auth', authRouter);

// Protected routes
app.use('/contacts', authMiddleware, contactsRouter);
app.use('/messages', authMiddleware, messagesRouter);
app.use('/groups', authMiddleware, groupsRouter);
app.use('/agora', authMiddleware, agoraRouter);

// Socket.io
registerSocketHandlers(io);

server.listen(env.PORT, () => {
  console.log(`[VoxLink] Server running on http://localhost:${env.PORT}`);
});

export { app, io };
