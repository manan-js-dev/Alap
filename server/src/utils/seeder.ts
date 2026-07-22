/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Room from '../models/Room';
import ChatRequest from '../models/ChatRequest';

dotenv.config();

export const seedDemoData = async () => {
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
        { returnDocument: 'after' },
      );
      if (updated) createdUsers.push(updated);
      console.log(`ℹ️ Updated demo user: ${userData.username}`);
    }
  }

  const alex = await User.findOne({ email: 'demo1@alap.com' });
  const sara = await User.findOne({ email: 'demo2@alap.com' });

  if (!alex || !sara) {
    console.error('❌ Demo users not found');
    return;
  }

  const demoRoom = await Room.findOne({ name: 'demo-general' });
  if (!demoRoom) {
    await Room.create({
      name: 'demo-general',
      description: '🎯 Demo room — explore Alap features here!',
      createdBy: alex._id,
      members: [alex._id, sara._id],
      admins: [alex._id],
      isDirect: false,
    });
    console.log('✅ Created demo group room');
  }

  const existingRequest = await ChatRequest.findOne({
    $or: [
      { sender: alex._id, receiver: sara._id },
      { sender: sara._id, receiver: alex._id },
    ],
  });

  if (!existingRequest) {
    const dmRoom = await Room.create({
      name: `dm_${alex._id}_${sara._id}`,
      description: 'Direct Message',
      createdBy: alex._id,
      members: [alex._id, sara._id],
      isDirect: true,
    });

    await ChatRequest.create({
      sender: alex._id,
      receiver: sara._id,
      status: 'accepted',
      room: dmRoom._id,
    });
    console.log('✅ Created DM between demo users');
  }

  console.log('🎉 Seeding complete!');
};

// Run directly if called via npm run seed
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI as string)
    .then(async () => {
      console.log('✅ MongoDB connected');
      await seedDemoData();
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
