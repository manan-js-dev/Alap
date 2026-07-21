/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import Room from '../models/Room';
import User from '../models/User';
import mongoose from 'mongoose';

let ioInstance: Server;

export const socketHandler = (io: Server) => {
  ioInstance = io;

  io.on('connection', async (socket: Socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.headers['userid'];
    console.log(`⚡ User connected: ${userId}`);

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        socketId: socket.id,
      });
      io.emit('user_status', { userId, isOnline: true });
    }

    socket.on('join_room', async (roomId: string) => {
      const cleanRoomId = roomId.replace(/"/g, '').trim();
      socket.join(cleanRoomId);
      console.log(`👤 User ${userId} joined room ${cleanRoomId}`);
      socket.to(cleanRoomId).emit('user_joined', { userId, cleanRoomId });
    });

    socket.on('leave_room', (roomId: string) => {
      const cleanRoomId = roomId.replace(/"/g, '').trim();
      socket.leave(cleanRoomId);
      socket.to(cleanRoomId).emit('user_left', { userId, roomId: cleanRoomId });
    });

    socket.on('send_message', async (data) => {
      const roomId = typeof data === 'string' ? JSON.parse(data).roomId : data.roomId;
      const content = typeof data === 'string' ? JSON.parse(data).content : data.content;
      const cleanRoomId = roomId?.replace(/"/g, '').trim();

      if (!cleanRoomId || !content) {
        socket.emit('error', { message: 'roomId and content are required' });
        return;
      }

      try {
        const room = await Room.findById(cleanRoomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const isMember = room.members.some((m) => m.toString() === userId);
        if (!isMember) {
          socket.emit('error', {
            message: 'You are not a member of this room',
          });
          socket.emit('kicked_from_room', { roomId: cleanRoomId });
          return;
        }

        const message = await Message.create({
          room: new mongoose.Types.ObjectId(cleanRoomId),
          sender: new mongoose.Types.ObjectId(userId),
          content,
          type: 'text',
        });

        await Room.findByIdAndUpdate(cleanRoomId, { lastMessage: message._id });
        const populated = await message.populate('sender', 'username isOnline');
        io.to(cleanRoomId).emit('new_message', populated);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ roomId, username, isTyping }) => {
      socket.to(roomId).emit('user_typing', { username, isTyping });
    });

    socket.on('notify_message', async ({ roomId, senderId }) => {
      console.log(`📨 notify_message received for room ${roomId} from ${senderId}`);

      const room = await Room.findById(roomId).select('members');
      if (!room) return;

      // Get socket IDs from DB instead of memory Map
      const members = await User.find({
        _id: { $in: room.members },
        isOnline: true,
        socketId: { $exists: true, $ne: null },
      }).select('_id socketId');

      members.forEach((member) => {
        if (member._id.toString() !== senderId && member.socketId) {
          console.log(`📨 Notifying member ${member._id} via socket ${member.socketId}`);
          io.to(member.socketId).emit('new_message_notification', {
            roomId,
            senderId,
          });
        }
      });
    });

    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}`);
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: null,
        });
        io.emit('user_status', { userId, isOnline: false });
      }
    });
  });
};

export const getIO = () => ioInstance;
