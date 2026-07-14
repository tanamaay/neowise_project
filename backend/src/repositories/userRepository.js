const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { encrypt, decrypt, hashForLookup } = require('../utils/encryption');

const COLLECTION = 'users';

function decryptUser(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: decrypt(user.name),
    email: decrypt(user.email),
    balance: user.balance,
    createdAt: user.createdAt,
  };
}

async function findByEmail(email) {
  const db = getDB();
  const emailHash = hashForLookup(email);
  const user = await db.collection(COLLECTION).findOne({ emailHash });
  return decryptUser(user);
}

async function findById(id) {
  const db = getDB();
  const user = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  return decryptUser(user);
}

async function findByIdRaw(id) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

async function findAll() {
  const db = getDB();
  const users = await db.collection(COLLECTION).find({}).toArray();
  return users.map(decryptUser);
}

async function create({ name, email, password, balance = 1000 }) {
  const db = getDB();
  const passwordHash = await bcrypt.hash(password, 10);

  const doc = {
    name: encrypt(name),
    email: encrypt(email),
    emailHash: hashForLookup(email),
    passwordHash,
    balance,
    createdAt: new Date(),
  };

  const result = await db.collection(COLLECTION).insertOne(doc);
  return findById(result.insertedId.toString());
}

async function updateBalance(userId, newBalance, session = null) {
  const db = getDB();
  const options = session ? { session } : {};
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(userId) },
    { $set: { balance: newBalance } },
    options
  );
}

module.exports = {
  findByEmail,
  findById,
  findByIdRaw,
  findAll,
  create,
  updateBalance,
  decryptUser,
  hashForLookup,
};
