function createNotificationService(io) {
  function notifyTransactionParties(event, payload) {
    const { transaction, sender, receiver } = payload;

    const senderNotification = buildNotification(event, payload, sender.id);
    const receiverNotification = buildNotification(event, payload, receiver.id);

    io.to(`user:${sender.id}`).emit('notification', senderNotification);
    io.to(`user:${receiver.id}`).emit('notification', receiverNotification);
  }

  function buildNotification(event, payload, userId) {
    const { transaction, sender, receiver } = payload;
    const isSender = userId === sender.id;

    if (event === 'transaction') {
      return {
        type: 'transfer',
        message: isSender
          ? `You sent $${transaction.amount.toFixed(2)} to ${receiver.name}`
          : `You received $${transaction.amount.toFixed(2)} from ${sender.name}`,
        transaction,
        balance: isSender ? sender.balance : receiver.balance,
        timestamp: new Date().toISOString(),
      };
    }

    if (event === 'reversal') {
      return {
        type: 'reversal',
        message: isSender
          ? `Transaction reversed: $${transaction.amount.toFixed(2)} returned from ${receiver.name}`
          : `Transaction reversed: $${transaction.amount.toFixed(2)} returned to ${sender.name}`,
        transaction,
        balance: isSender ? sender.balance : receiver.balance,
        timestamp: new Date().toISOString(),
      };
    }

    return { type: 'unknown', message: 'Notification received' };
  }

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return notifyTransactionParties;
}

module.exports = { createNotificationService };
