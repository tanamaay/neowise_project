const userRepository = require('../repositories/userRepository');
const transactionRepository = require('../repositories/transactionRepository');
const { runWithOptionalTransaction } = require('../utils/transactionHelper');

let notificationEmitter = null;

function setNotificationEmitter(emitter) {
  notificationEmitter = emitter;
}

function emitNotification(event, payload) {
  if (notificationEmitter) {
    notificationEmitter(event, payload);
  }
}

async function transfer(fromUserId, toUserId, amount, description = '') {
  if (fromUserId === toUserId) {
    throw new Error('Cannot transfer to yourself');
  }

  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const sender = await userRepository.findByIdRaw(fromUserId);
  const receiver = await userRepository.findByIdRaw(toUserId);

  if (!sender) throw new Error('Sender not found');
  if (!receiver) throw new Error('Receiver not found');
  if (sender.balance < amount) throw new Error('Insufficient balance');

  const transaction = await runWithOptionalTransaction(async (session) => {
    await userRepository.updateBalance(fromUserId, sender.balance - amount, session);
    await userRepository.updateBalance(toUserId, receiver.balance + amount, session);

    return transactionRepository.create(
      {
        fromUserId,
        toUserId,
        amount,
        type: 'transfer',
        status: 'completed',
        description,
      },
      session
    );
  });

  const updatedSender = await userRepository.findById(fromUserId);
  const updatedReceiver = await userRepository.findById(toUserId);

  emitNotification('transaction', {
    transaction,
    sender: updatedSender,
    receiver: updatedReceiver,
  });

  return transaction;
}

async function reverseTransaction(transactionId, requestingUserId) {
  const original = await transactionRepository.findById(transactionId);

  if (!original) throw new Error('Transaction not found');
  if (original.status === 'reversed') throw new Error('Transaction already reversed');
  if (original.type === 'reversal') throw new Error('Cannot reverse a reversal transaction');

  const isInvolved =
    original.fromUserId === requestingUserId || original.toUserId === requestingUserId;
  if (!isInvolved) throw new Error('Not authorized to reverse this transaction');

  const sender = await userRepository.findByIdRaw(original.toUserId);
  const receiver = await userRepository.findByIdRaw(original.fromUserId);

  if (!sender || !receiver) throw new Error('Users not found');
  if (sender.balance < original.amount) throw new Error('Insufficient balance to reverse');

  const reversalTransaction = await runWithOptionalTransaction(async (session) => {
    await userRepository.updateBalance(
      original.toUserId,
      sender.balance - original.amount,
      session
    );
    await userRepository.updateBalance(
      original.fromUserId,
      receiver.balance + original.amount,
      session
    );

    await transactionRepository.markReversed(transactionId, session);

    return transactionRepository.create(
      {
        fromUserId: original.toUserId,
        toUserId: original.fromUserId,
        amount: original.amount,
        type: 'reversal',
        status: 'completed',
        description: `Reversal of transaction ${transactionId}`,
        reversedTransactionId: transactionId,
      },
      session
    );
  });

  const updatedSender = await userRepository.findById(original.toUserId);
  const updatedReceiver = await userRepository.findById(original.fromUserId);

  emitNotification('reversal', {
    transaction: reversalTransaction,
    originalTransaction: original,
    sender: updatedSender,
    receiver: updatedReceiver,
  });

  return reversalTransaction;
}

async function getTransactionsForUser(userId, options) {
  return transactionRepository.findByUserId(userId, options);
}

module.exports = {
  setNotificationEmitter,
  transfer,
  reverseTransaction,
  getTransactionsForUser,
};
