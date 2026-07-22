/* eslint-disable no-console */
import cron from 'node-cron';
import { ref, remove, push, getDatabase } from 'firebase/database';
import { initializeApp, getApps } from 'firebase/app';
import User from '../models/User';
import Room from '../models/Room';
import Message from '../models/Message';
import ChatRequest from '../models/ChatRequest';
import { seedDemoData } from './seeder';

// Initialize Firebase for server-side
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp =
  getApps().find((app) => app.name === 'cron-app') || initializeApp(firebaseConfig, 'cron-app');
const db = getDatabase(firebaseApp);

const DEMO_EMAILS = ['demo1@alap.com', 'demo2@alap.com'];

const cleanAndReseed = async () => {
  try {
    console.log('🧹 Starting 12-hour cleanup job...');

    // Get demo user IDs to protect them
    const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } });
    const demoUserIds = demoUsers.map((u) => u._id.toString());

    // Delete non-demo users
    await User.deleteMany({ email: { $nin: DEMO_EMAILS } });
    console.log('✅ Deleted non-demo users');

    // Delete non-demo rooms
    const demoRooms = await Room.find({
      $or: [{ name: 'demo-general' }, { name: { $regex: /^dm_/ }, members: { $all: demoUserIds } }],
    });
    const demoRoomIds = demoRooms.map((r) => r._id.toString());
    await Room.deleteMany({ _id: { $nin: demoRoomIds } });
    console.log('✅ Deleted non-demo rooms');

    // Delete non-demo chat requests
    await ChatRequest.deleteMany({
      sender: { $nin: demoUserIds },
      receiver: { $nin: demoUserIds },
    });
    console.log('✅ Deleted non-demo chat requests');

    // Delete all MongoDB messages
    await Message.deleteMany({});
    console.log('✅ Deleted all MongoDB messages');

    // Delete all Firebase messages
    const rootRef = ref(db, 'rooms');
    await remove(rootRef);
    console.log('✅ Deleted all Firebase messages');

    // Reseed demo data
    await seedDemoData();

    // Add welcome messages to Firebase for demo room
    const demoRoom = await Room.findOne({ name: 'demo-general' });
    const alex = await User.findOne({ email: 'demo1@alap.com' });
    const sara = await User.findOne({ email: 'demo2@alap.com' });

    if (demoRoom && alex && sara) {
      const messagesRef = ref(db, `rooms/${demoRoom._id}/messages`);
      await push(messagesRef, {
        content: 'Hey Sara! Welcome to the demo room 👋',
        senderId: alex._id.toString(),
        senderName: 'Demo_Alex',
        senderAvatar: alex.avatar,
        createdAt: Date.now() - 60000,
      });
      await push(messagesRef, {
        content: 'Hi Alex! This is Alap — a real-time chat app 💬',
        senderId: sara._id.toString(),
        senderName: 'Demo_Sara',
        senderAvatar: sara.avatar,
        createdAt: Date.now() - 30000,
      });
      await push(messagesRef, {
        content: 'Try sending a message, creating rooms, or connecting with others! 🚀',
        senderId: alex._id.toString(),
        senderName: 'Demo_Alex',
        senderAvatar: alex.avatar,
        createdAt: Date.now(),
      });
      console.log('✅ Added welcome messages to Firebase');
    }

    console.log('🎉 Cleanup and reseed complete!');
  } catch (error) {
    console.error('❌ Cron job failed:', error);
  }
};

const keepAlive = async () => {
  try {
    const response = await fetch(`${process.env.SERVER_URL || 'http://localhost:5000'}/api/health`);
    const data = (await response.json()) as { status: string };
    console.log(`💓 Keep-alive ping: ${data.status}`);
  } catch (error) {
    console.error('❌ Keep-alive ping failed:', error);
  }
};

export const startCronJobs = () => {
  // Keep server alive every 14 minutes
  cron.schedule('*/14 * * * *', () => {
    console.log('💓 Running keep-alive ping...');
    keepAlive();
  });

  // Clean and reseed every 12 hours
  cron.schedule('0 0,12 * * *', () => {
    console.log('🧹 Running 12-hour cleanup job...');
    cleanAndReseed();
  });

  console.log('✅ Cron jobs started');
  console.log('   💓 Keep-alive: every 14 minutes');
  console.log('   🧹 Cleanup: every 12 hours (00:00 & 12:00)');
};
