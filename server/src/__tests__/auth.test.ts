import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import authRoutes from '../routes/auth.routes';
import User from '../models/User';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
});

afterAll(async () => {
  await User.deleteMany({ email: /testuser/i });
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  test('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'testuser@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
  });

  test('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'testuser2',
      email: 'testuser2@test.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser2copy',
      email: 'testuser2@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  test('should fail Zod validation with bad inputs', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'notanemail',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      username: 'testuser3',
      email: 'testuser3@test.com',
      password: 'password123',
    });
  });

  test('should login and return token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser3@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'testuser3@test.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('should reject non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@test.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('should return user data with valid token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'testuser3@test.com',
      password: 'password123',
    });
    const token = loginRes.body.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('testuser3@test.com');
  });

  test('should reject request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  test('should reject request with invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer faketoken123');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, invalid token');
  });
});
