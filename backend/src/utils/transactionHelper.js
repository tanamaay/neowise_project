const { getDB } = require('../config/db');

async function runWithOptionalTransaction(callback) {
  const db = getDB();
  const session = db.client.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } catch (err) {
    const isReplicaSetError =
      err.code === 20 ||
      err.codeName === 'IllegalOperation' ||
      (err.message && err.message.includes('replica set'));

    if (isReplicaSetError) {
      return callback(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = { runWithOptionalTransaction };
