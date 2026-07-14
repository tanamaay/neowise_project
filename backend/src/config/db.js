const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectDB(uri, dbName) {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  await db.collection('users').createIndex({ emailHash: 1 }, { unique: true });
  await db.collection('transactions').createIndex({ fromUserId: 1, createdAt: -1 });
  await db.collection('transactions').createIndex({ toUserId: 1, createdAt: -1 });

  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectDB, getDB, closeDB };
