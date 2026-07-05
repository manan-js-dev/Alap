import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';

import authRoutes from '../routes/auth.routes';
import roomRoutes from '../routes/room.routes';
import messageRoutes from '../routes/message.routes';
import User from '../models/User';
import Room from '../models/Room';
import Message from '../models/Message';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', messageRoutes);

let token: string;
let roomId: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);

  // Register and login test user
  await request(app).post('/api/auth/register').send({
    username: 'roomtestuser',
    email: 'roomtest@test.com',
    password: 'password123',
  });

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'roomtest@test.com',
    password: 'password123',
  });

  token = loginRes.body.token;
});

afterAll(async () => {
  await User.deleteMany({ email: /roomtest/i });
  await Room.deleteMany({ name: /test/i });
  await Message.deleteMany({});
  await mongoose.connection.close();
});

describe('POST /api/rooms', () => {
  test('should create a new room', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'testroom', description: 'A test room' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('testroom');
    expect(res.body.members.length).toBe(1);
    roomId = res.body._id;
  });

  test('should reject duplicate room name', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'testroom', description: 'duplicate' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Room name already exists');
  });

  test('should fail Zod validation with short name', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ab' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  test('should reject unauthenticated request', async () => {
    const res = await request(app).post('/api/rooms').send({ name: 'anotherroom' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/rooms', () => {
  test('should return list of rooms', async () => {
    const res = await request(app).get('/api/rooms').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/rooms/:id', () => {
  test('should return a single room with members', async () => {
    const res = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body._id).toBe(roomId);
    expect(res.body.members).toBeDefined();
  });

  test('should return 500 for invalid room id', async () => {
    const res = await request(app)
      .get('/api/rooms/invalidid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/rooms/:roomId/messages', () => {
  test('should send a message to a room', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello from test!' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Hello from test!');
    expect(res.body.sender).toBeDefined();
  });

  test('should reject empty message', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });

  test('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post(`/api/rooms/${roomId}/messages`)
      .send({ content: 'Hello!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/rooms/:roomId/messages', () => {
  test('should return messages for a room', async () => {
    const res = await request(app)
      .get(`/api/rooms/${roomId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should reject unauthenticated request', async () => {
    const res = await request(app).get(`/api/rooms/${roomId}/messages`);
    expect(res.status).toBe(401);
  });
});
