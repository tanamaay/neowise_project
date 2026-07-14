const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () => request('/auth/me'),

  getUsers: () => request('/auth/users'),

  getTransactions: () => request('/transactions'),

  transfer: (toUserId, amount, description) =>
    request('/transactions/transfer', {
      method: 'POST',
      body: JSON.stringify({ toUserId, amount, description }),
    }),

  reverseTransaction: (id) =>
    request(`/transactions/${id}/reverse`, { method: 'POST' }),
};
