/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Room from '../models/Room';
import ChatRequest from '../models/ChatRequest';

dotenv.config();

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ MongoDB connected');

    const demoUsers = [
      {
        username: 'Demo_Alex',
        email: 'demo1@alap.com',
        password: 'demo123456',
        bio: 'Hey there! I am using Alap 👋',
        avatar:
          'https://res.cloudinary.com/okssbieb/image/upload/v1784619250/cdlwidpwkaxg8igkkuqa.png',
        isOnline: false,
      },
      {
        username: 'Demo_Sara',
        email: 'demo2@alap.com',
        password: 'demo123456',
        bio: 'Hey there! I am using Alap 👋',
        avatar:
          'https://res.cloudinary.com/okssbieb/image/upload/v1784619250/uve5me6at3upuzdbjd1v.png',
        isOnline: false,
      },
    ];

    // Create or update demo users
    const createdUsers = [];
    for (const userData of demoUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`✅ Created demo user: ${userData.username}`);
      } else {
        const updated = await User.findOneAndUpdate(
          { email: userData.email },
          { avatar: userData.avatar, bio: userData.bio },
          { new: true },
        );
        if (updated) createdUsers.push(updated);
        console.log(`ℹ️ Updated demo user: ${userData.username}`);
      }
    }

    const alex = await User.findOne({ email: 'demo1@alap.com' });
    const sara = await User.findOne({ email: 'demo2@alap.com' });

    if (!alex || !sara) {
      console.error('❌ Demo users not found');
      process.exit(1);
    }

    // Create demo group room
    let demoRoom = await Room.findOne({ name: 'demo-general' });
    if (!demoRoom) {
      demoRoom = await Room.create({
        name: 'demo-general',
        description: '🎯 Demo room — explore Alap features here!',
        createdBy: alex._id,
        members: [alex._id, sara._id],
        admins: [alex._id],
        isDirect: false,
      });
      console.log('✅ Created demo group room');
    } else {
      console.log('ℹ️ Demo group room already exists');
    }

    // Create DM between Alex and Sara
    const existingRequest = await ChatRequest.findOne({
      $or: [
        { sender: alex._id, receiver: sara._id },
        { sender: sara._id, receiver: alex._id },
      ],
    });

    if (!existingRequest) {
      // Create DM room
      const dmRoom = await Room.create({
        name: `dm_${alex._id}_${sara._id}`,
        description: 'Direct Message',
        createdBy: alex._id,
        members: [alex._id, sara._id],
        isDirect: true,
      });

      // Create accepted chat request
      await ChatRequest.create({
        sender: alex._id,
        receiver: sara._id,
        status: 'accepted',
        room: dmRoom._id,
      });

      console.log('✅ Created DM between Demo_Alex and Demo_Sara');
    } else {
      console.log('ℹ️ DM already exists between demo users');
    }

    console.log('🎉 Seeding complete!');
    console.log('-------------------');
    console.log('Demo credentials:');
    console.log('User 1 → demo1@alap.com / demo123456 (Demo_Alex - Male)');
    console.log('User 2 → demo2@alap.com / demo123456 (Demo_Sara - Female)');
    console.log('-------------------');
    console.log('Now add messages to Firebase manually for the DM room');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDemoUsers();
