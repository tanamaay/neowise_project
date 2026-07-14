export default function TransactionHistory({
  transactions,
  currentUserId,
  users,
  onReverse,
  reversingId,
}) {
  const getUserName = (userId) => {
    if (userId === currentUserId) return 'You';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Unknown';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p>No transactions yet</p>
        <span>Your transfer history will appear here</span>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {transactions.map((tx) => {
        const isOutgoing = tx.fromUserId === currentUserId;
        const isReversal = tx.type === 'reversal';
        const canReverse =
          tx.status === 'completed' &&
          tx.type === 'transfer' &&
          !isReversal;

        return (
          <div key={tx.id} className={`transaction-item ${isOutgoing ? 'outgoing' : 'incoming'}`}>
            <div className="tx-icon">
              {isReversal ? '↩' : isOutgoing ? '↑' : '↓'}
            </div>
            <div className="tx-details">
              <p className="tx-title">
                {isReversal
                  ? 'Reversal'
                  : isOutgoing
                    ? `Sent to ${getUserName(tx.toUserId)}`
                    : `Received from ${getUserName(tx.fromUserId)}`}
              </p>
              {tx.description && <p className="tx-desc">{tx.description}</p>}
              <p className="tx-date">{formatDate(tx.createdAt)}</p>
            </div>
            <div className="tx-amount-col">
              <span className={`tx-amount ${isOutgoing ? 'negative' : 'positive'}`}>
                {isOutgoing ? '-' : '+'}${tx.amount.toFixed(2)}
              </span>
              <span className={`tx-status status-${tx.status}`}>{tx.status}</span>
              {canReverse && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onReverse(tx.id)}
                  disabled={reversingId === tx.id}
                >
                  {reversingId === tx.id ? 'Reversing...' : 'Reverse'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
