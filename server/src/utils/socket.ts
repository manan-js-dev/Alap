/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import Room from '../models/Room';
import User from '../models/User';
import mongoose from 'mongoose';

export const socketHandler = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    // Look for auth.userId first (frontend), fallback to headers.userid (Postman)
    const userId = socket.handshake.auth?.userId || socket.handshake.headers['userid'];
    console.log(`⚡ User connected: ${userId}`);

    // Mark user online
    if (userId) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      io.emit('user_status', { userId, isOnline: true });
    }

    // Join a room
    socket.on('join_room', async (roomId: string) => {
      const cleanRoomId = roomId.replace(/"/g, '').trim();
      socket.join(cleanRoomId);
      console.log(`👤 User ${userId} joined room ${cleanRoomId}`);

      // Add user to room members if not already
      await Room.findByIdAndUpdate(cleanRoomId, {
        $addToSet: { members: new mongoose.Types.ObjectId(userId) },
      });

      // Notify others in room
      socket.to(cleanRoomId).emit('user_joined', { userId, cleanRoomId });
    });

    // Leave a room
    socket.on('leave_room', (roomId: string) => {
      const cleanRoomId = roomId.replace(/"/g, '').trim();
      socket.leave(cleanRoomId);
      socket.to(cleanRoomId).emit('user_left', { userId, roomId: cleanRoomId });
    });

    // Send a message
    socket.on('send_message', async (data) => {
      const roomId = typeof data === 'string' ? JSON.parse(data).roomId : data.roomId;
      const content = typeof data === 'string' ? JSON.parse(data).content : data.content;
      const cleanRoomId = roomId?.replace(/"/g, '').trim();

      if (!cleanRoomId || !content) {
        socket.emit('error', { message: 'roomId and content are required' });
        return;
      }

      try {
        const message = await Message.create({
          room: new mongoose.Types.ObjectId(cleanRoomId),
          sender: new mongoose.Types.ObjectId(userId),
          content,
          type: 'text',
        });

        await Room.findByIdAndUpdate(cleanRoomId, { lastMessage: message._id });
        const populated = await message.populate('sender', 'username isOnline');
        io.to(cleanRoomId).emit('new_message', populated);
        console.log(`💬 Message sent to room ${cleanRoomId}: ${content}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message', error: err });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, username, isTyping }) => {
      socket.to(roomId).emit('user_typing', { username, isTyping });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}`);
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit('user_status', { userId, isOnline: false });
      }
    });
  });
};
