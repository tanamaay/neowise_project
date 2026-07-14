const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB, getDB } = require('../../src/config/db');
const { createApp } = require('../../src/app');
const userRepository = require('../../src/repositories/userRepository');
const { generateToken } = require('../../src/services/authService');

let mongoServer;
let app;
let user1, user2;
let token1, token2;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri(), 'test_api');
  app = createApp();
});

afterAll(async () => {
  await closeDB();
  await mongoServer.stop();
});

beforeEach(async () => {
  const db = getDB();
  await db.collection('users').deleteMany({});
  await db.collection('transactions').deleteMany({});

  user1 = await userRepository.create({
    name: 'Alice',
    email: 'alice@test.com',
    password: 'pass123',
    balance: 1000,
  });
  user2 = await userRepository.create({
    name: 'Bob',
    email: 'bob@test.com',
    password: 'pass123',
    balance: 500,
  });

  token1 = generateToken(user1.id);
  token2 = generateToken(user2.id);
});

describe('API Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'pass123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alice@test.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/transactions', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.status).toBe(401);
    });

    it('should return user transactions and balance', async () => {
      await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({ toUserId: user2.id, amount: 200 });

      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(1);
      expect(res.body.balance).toBe(800);
    });
  });

  describe('POST /api/transactions/transfer', () => {
    it('should transfer funds successfully', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({ toUserId: user2.id, amount: 300, description: 'Payment' });

      expect(res.status).toBe(201);
      expect(res.body.transaction.amount).toBe(300);
      expect(res.body.balance).toBe(700);
    });

    it('should reject insufficient balance', async () => {
      const res = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({ toUserId: user2.id, amount: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Insufficient balance');
    });
  });

  describe('POST /api/transactions/:id/reverse', () => {
    it('should reverse a transaction', async () => {
      const transferRes = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({ toUserId: user2.id, amount: 150 });

      const txId = transferRes.body.transaction.id;

      const res = await request(app)
        .post(`/api/transactions/${txId}/reverse`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.transaction.type).toBe('reversal');
      expect(res.body.balance).toBe(1000);
    });
  });

  describe('GET /api/auth/users', () => {
    it('should list other users', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].name).toBe('Bob');
    });
  });
});
