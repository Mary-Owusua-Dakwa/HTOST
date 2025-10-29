import { getAuth } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function authHeaders() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return {};
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

export async function fetchStudents() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/students`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createStudent(payload) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, await authHeaders());
  const res = await fetch(`${API_BASE}/students`, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
