require('dotenv').config();

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { encrypt, hashForLookup } = require('../src/utils/encryption');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'transaction_ledger';

const SEED_USERS = [
  { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', balance: 5000 },
  { name: 'Bob Smith', email: 'bob@example.com', password: 'password123', balance: 3500 },
  { name: 'Carol Williams', email: 'carol@example.com', password: 'password123', balance: 4200 },
  { name: 'David Brown', email: 'david@example.com', password: 'password123', balance: 2800 },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(`Connected to MongoDB: ${DB_NAME}`);
    console.log('Wiping database...');

    await db.dropDatabase();
    console.log('Database wiped successfully.');

    await db.collection('users').createIndex({ emailHash: 1 }, { unique: true });
    await db.collection('transactions').createIndex({ fromUserId: 1, createdAt: -1 });
    await db.collection('transactions').createIndex({ toUserId: 1, createdAt: -1 });

    console.log('Seeding users...');
    const userDocs = [];

    for (const user of SEED_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      userDocs.push({
        name: encrypt(user.name),
        email: encrypt(user.email),
        emailHash: hashForLookup(user.email),
        passwordHash,
        balance: user.balance,
        createdAt: new Date(),
      });
    }

    const userResult = await db.collection('users').insertMany(userDocs);
    const userIds = Object.values(userResult.insertedIds);

    console.log(`Inserted ${userIds.length} users.`);

    console.log('Seeding sample transactions...');
    const transactions = [
      {
        fromUserId: userIds[0],
        toUserId: userIds[1],
        amount: 250,
        type: 'transfer',
        status: 'completed',
        description: 'Lunch split',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        fromUserId: userIds[2],
        toUserId: userIds[0],
        amount: 500,
        type: 'transfer',
        status: 'completed',
        description: 'Project payment',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        fromUserId: userIds[1],
        toUserId: userIds[3],
        amount: 150,
        type: 'transfer',
        status: 'completed',
        description: 'Shared cab fare',
        createdAt: new Date(Date.now() - 86400000),
      },
    ];

    await db.collection('transactions').insertMany(transactions);
    console.log(`Inserted ${transactions.length} transactions.`);

    console.log('\n--- Seed Complete ---');
    console.log('Demo accounts (password: password123):');
    SEED_USERS.forEach((u) => console.log(`  ${u.email}`));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
