import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import NotificationToast, { useNotifications } from './NotificationToast';
import TransferModal from './TransferModal';
import TransactionHistory from './TransactionHistory';

export default function Dashboard() {
  const { user, logout, updateBalance } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [balance, setBalance] = useState(user?.balance || 0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reversingId, setReversingId] = useState(null);
  const { notifications, addNotification, dismiss } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      const [txData, usersData] = await Promise.all([
        api.getTransactions(),
        api.getUsers(),
      ]);
      setTransactions(txData.transactions);
      setBalance(txData.balance);
      updateBalance(txData.balance);
      setUsers(usersData.users);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [updateBalance]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNotification = useCallback(
    (data) => {
      addNotification(data);
      if (data.balance != null) {
        setBalance(data.balance);
        updateBalance(data.balance);
      }
      fetchData();
    },
    [addNotification, updateBalance, fetchData]
  );

  const { connected } = useSocket(user?.id, handleNotification);

  const handleTransferSuccess = (result) => {
    setBalance(result.balance);
    updateBalance(result.balance);
    fetchData();
  };

  const handleReverse = async (txId) => {
    setReversingId(txId);
    try {
      const result = await api.reverseTransaction(txId);
      setBalance(result.balance);
      updateBalance(result.balance);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setReversingId(null);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <NotificationToast notifications={notifications} onDismiss={dismiss} />

      <header className="dashboard-header">
        <div>
          <h1>Transaction Ledger</h1>
          <p className="welcome">Welcome, {user?.name}</p>
        </div>
        <div className="header-actions">
          <span className={`connection-badge ${connected ? 'online' : 'offline'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
          <button className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="balance-card">
        <p className="balance-label">Current Balance</p>
        <h2 className="balance-amount">${balance.toFixed(2)}</h2>
        <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)}>
          Transfer Funds
        </button>
      </section>

      <section className="history-section">
        <h3>Transaction History</h3>
        <TransactionHistory
          transactions={transactions}
          currentUserId={user?.id}
          users={users}
          onReverse={handleReverse}
          reversingId={reversingId}
        />
      </section>

      <TransferModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        users={users}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
