const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB, closeDB, getDB } = require('../../src/config/db');
const userRepository = require('../../src/repositories/userRepository');
const transactionRepository = require('../../src/repositories/transactionRepository');
const transactionService = require('../../src/services/transactionService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri(), 'test_ledger');
});

afterAll(async () => {
  await closeDB();
  await mongoServer.stop();
});

beforeEach(async () => {
  const db = getDB();
  await db.collection('users').deleteMany({});
  await db.collection('transactions').deleteMany({});
});

describe('Transaction Service', () => {
  let user1, user2;

  beforeEach(async () => {
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
  });

  describe('transfer', () => {
    it('should transfer funds between users', async () => {
      const tx = await transactionService.transfer(user1.id, user2.id, 200, 'Test transfer');

      expect(tx.amount).toBe(200);
      expect(tx.status).toBe('completed');
      expect(tx.fromUserId).toBe(user1.id);
      expect(tx.toUserId).toBe(user2.id);

      const updatedSender = await userRepository.findById(user1.id);
      const updatedReceiver = await userRepository.findById(user2.id);

      expect(updatedSender.balance).toBe(800);
      expect(updatedReceiver.balance).toBe(700);
    });

    it('should reject transfer with insufficient balance', async () => {
      await expect(
        transactionService.transfer(user1.id, user2.id, 5000)
      ).rejects.toThrow('Insufficient balance');
    });

    it('should reject self-transfer', async () => {
      await expect(
        transactionService.transfer(user1.id, user1.id, 100)
      ).rejects.toThrow('Cannot transfer to yourself');
    });

    it('should reject zero or negative amount', async () => {
      await expect(
        transactionService.transfer(user1.id, user2.id, 0)
      ).rejects.toThrow('Amount must be greater than zero');

      await expect(
        transactionService.transfer(user1.id, user2.id, -50)
      ).rejects.toThrow('Amount must be greater than zero');
    });
  });

  describe('reverseTransaction', () => {
    it('should reverse a completed transaction', async () => {
      const tx = await transactionService.transfer(user1.id, user2.id, 300);

      const reversal = await transactionService.reverseTransaction(tx.id, user1.id);

      expect(reversal.type).toBe('reversal');
      expect(reversal.amount).toBe(300);

      const sender = await userRepository.findById(user1.id);
      const receiver = await userRepository.findById(user2.id);

      expect(sender.balance).toBe(1000);
      expect(receiver.balance).toBe(500);

      const original = await transactionRepository.findById(tx.id);
      expect(original.status).toBe('reversed');
    });

    it('should reject reversing an already reversed transaction', async () => {
      const tx = await transactionService.transfer(user1.id, user2.id, 100);
      await transactionService.reverseTransaction(tx.id, user1.id);

      await expect(
        transactionService.reverseTransaction(tx.id, user1.id)
      ).rejects.toThrow('Transaction already reversed');
    });

    it('should reject unauthorized reversal', async () => {
      const user3 = await userRepository.create({
        name: 'Carol',
        email: 'carol@test.com',
        password: 'pass123',
        balance: 1000,
      });

      const tx = await transactionService.transfer(user1.id, user2.id, 100);

      await expect(
        transactionService.reverseTransaction(tx.id, user3.id)
      ).rejects.toThrow('Not authorized to reverse this transaction');
    });
  });

  describe('getTransactionsForUser', () => {
    it('should return transactions for a user', async () => {
      await transactionService.transfer(user1.id, user2.id, 100);
      await transactionService.transfer(user2.id, user1.id, 50);

      const txs = await transactionService.getTransactionsForUser(user1.id);
      expect(txs).toHaveLength(2);
    });
  });
});
