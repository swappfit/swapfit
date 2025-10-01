const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAdminDashboard() {
  const res = await fetch(`${API_BASE_URL}/dashboard`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch admin dashboard');
  const json = await res.json();
  return json.data;
}

export async function listUsers({ page = 1, limit = 20, role } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (role) params.set('role', role);
  const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  const json = await res.json();
  return json.data;
}

export async function listPendingGyms() {
  const res = await fetch(`${API_BASE_URL}/admin/gyms/pending`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch pending gyms');
  const json = await res.json();
  return json.data;
}

export async function listChallenges({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/challenges?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch challenges');
  return res.json();
}

export async function listSchedules() {
  const res = await fetch(`${API_BASE_URL}/admin/schedules`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch schedules');
  const json = await res.json();
  return json.data;
}

export async function getGymPlans(gymId) {
  const res = await fetch(`${API_BASE_URL}/gyms/${gymId}/plans`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch gym plans');
  const json = await res.json();
  return json.data;
}

export async function getMyTransactions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE_URL}/transactions/me?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  const json = await res.json();
  return json.data; // { token, user, redirectTo }
}


