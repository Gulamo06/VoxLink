import { Server as SocketServer, Socket } from 'socket.io';
import { authenticateSocket } from '../middleware/auth.js';

// Store active users and their chat rooms
interface UserSession {
  userId: string;
  socket: Socket;
  username?: string;
  status: 'online' | 'typing' | 'offline';
}

const activeSessions = new Map<string, UserSession>();
const userChatRooms = new Map<string, Set<string>>(); // userId -> Set of chatIds

export function registerSocketHandlers(io: SocketServer) {
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.auth?.userId;
    const username = socket.handshake.auth?.username;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`[Socket] User connected: ${userId}`);

    // Store user session
    activeSessions.set(socket.id, {
      userId,
      socket,
      username,
      status: 'online'
    });

    // Notify others that user is online
    socket.broadcast.emit('user:status', {
      userId,
      status: 'online',
      username
    });

    // Join chat room
    socket.on('chat:join', (data: { chatId: string }) => {
      const { chatId } = data;
      const roomId = `chat:${chatId}`;

      socket.join(roomId);

      // Track user's chat rooms
      if (!userChatRooms.has(userId)) {
        userChatRooms.set(userId, new Set());
      }
      userChatRooms.get(userId)!.add(chatId);

      // Notify room that user joined
      socket.to(roomId).emit('chat:user-joined', {
        userId,
        username,
        chatId
      });

      console.log(`[Socket] User ${userId} joined chat ${chatId}`);
    });

    // Send message
    socket.on('chat:send-message', (data: {
      chatId: string;
      messageId: string;
      text?: string;
      voiceUrl?: string;
      timestamp: string;
    }) => {
      const { chatId, messageId, text, voiceUrl, timestamp } = data;
      const roomId = `chat:${chatId}`;

      const message = {
        id: messageId,
        chatId,
        senderId: userId,
        senderName: username,
        text: text || undefined,
        voiceUrl: voiceUrl || undefined,
        createdAt: timestamp,
        read: false
      };

      // Broadcast to room
      io.to(roomId).emit('chat:message', message);

      console.log(`[Socket] Message sent in chat ${chatId}: ${text ? text.substring(0, 30) : 'voice message'}`);
    });

    // Typing indicator
    socket.on('chat:typing', (data: { chatId: string; isTyping: boolean }) => {
      const { chatId, isTyping } = data;
      const roomId = `chat:${chatId}`;

      socket.to(roomId).emit('chat:typing', {
        userId,
        username,
        isTyping
      });
    });

    // Mark message as read
    socket.on('chat:message-read', (data: { chatId: string; messageId: string }) => {
      const { chatId, messageId } = data;
      const roomId = `chat:${chatId}`;

      io.to(roomId).emit('chat:message-read', {
        messageId,
        chatId,
        readBy: userId
      });
    });

    // Leave chat room
    socket.on('chat:leave', (data: { chatId: string }) => {
      const { chatId } = data;
      const roomId = `chat:${chatId}`;

      socket.leave(roomId);

      if (userChatRooms.has(userId)) {
        userChatRooms.get(userId)!.delete(chatId);
      }

      socket.to(roomId).emit('chat:user-left', {
        userId,
        username,
        chatId
      });

      console.log(`[Socket] User ${userId} left chat ${chatId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      activeSessions.delete(socket.id);

      // Notify all rooms that user disconnected
      userChatRooms.forEach((chatIds, sessUserId) => {
        if (sessUserId === userId) {
          chatIds.forEach(chatId => {
            io.to(`chat:${chatId}`).emit('user:status', {
              userId,
              status: 'offline',
              username
            });
          });
        }
      });

      userChatRooms.delete(userId);

      console.log(`[Socket] User disconnected: ${userId}`);
    });

    // Get online users in a chat
    socket.on('chat:get-online-users', (data: { chatId: string }, callback: Function) => {
      const { chatId } = data;
      const roomId = `chat:${chatId}`;
      const room = io.sockets.adapter.rooms.get(roomId);
      const onlineUsers = room ? Array.from(room).length : 0;

      callback({ onlineUsers });
    });

    // Emit user connected event
    socket.emit('user:connected', {
      userId,
      username,
      status: 'online'
    });
  });
}
