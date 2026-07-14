const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

const COLLECTION = 'transactions';

function formatTransaction(tx) {
  return {
    id: tx._id.toString(),
    fromUserId: tx.fromUserId.toString(),
    toUserId: tx.toUserId.toString(),
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    description: tx.description || '',
    reversedTransactionId: tx.reversedTransactionId
      ? tx.reversedTransactionId.toString()
      : null,
    createdAt: tx.createdAt,
  };
}

async function create(data, session = null) {
  const db = getDB();
  const doc = {
    fromUserId: new ObjectId(data.fromUserId),
    toUserId: new ObjectId(data.toUserId),
    amount: data.amount,
    type: data.type || 'transfer',
    status: data.status || 'completed',
    description: data.description || '',
    reversedTransactionId: data.reversedTransactionId
      ? new ObjectId(data.reversedTransactionId)
      : null,
    createdAt: new Date(),
  };

  const options = session ? { session } : {};
  const result = await db.collection(COLLECTION).insertOne(doc, options);
  const inserted = await db.collection(COLLECTION).findOne(
    { _id: result.insertedId },
    session ? { session } : {}
  );
  return formatTransaction(inserted);
}

async function findById(id) {
  const db = getDB();
  const tx = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  return tx ? formatTransaction(tx) : null;
}

async function findByUserId(userId, { limit = 50, skip = 0 } = {}) {
  const db = getDB();
  const oid = new ObjectId(userId);

  const transactions = await db
    .collection(COLLECTION)
    .find({
      $or: [{ fromUserId: oid }, { toUserId: oid }],
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return transactions.map(formatTransaction);
}

async function markReversed(id, session = null) {
  const db = getDB();
  const options = session ? { session } : {};
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'reversed' } },
    options
  );
}

module.exports = {
  create,
  findById,
  findByUserId,
  markReversed,
  formatTransaction,
};
