import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function TransferModal({ isOpen, onClose, users, onSuccess }) {
  const { user } = useAuth();
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.transfer(toUserId, parseFloat(amount), description);
      onSuccess(result);
      setToUserId('');
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transfer Funds</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="recipient">Recipient</label>
            <select
              id="recipient"
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              required
            >
              <option value="">Select a user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={user?.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <span className="form-hint">Available: ${user?.balance?.toFixed(2)}</span>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
