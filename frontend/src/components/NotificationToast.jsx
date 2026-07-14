import { useState } from 'react';

export default function NotificationToast({ notifications, onDismiss }) {
  return (
    <div className="toast-container">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`toast toast-${n.type}`}
          onClick={() => onDismiss(n.id)}
        >
          <span className="toast-icon">{n.type === 'reversal' ? '↩' : '💸'}</span>
          <div>
            <p className="toast-message">{n.message}</p>
            <p className="toast-balance">Balance: ${n.balance?.toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (data) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { ...data, id }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, addNotification, dismiss };
}
