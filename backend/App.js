import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { fetchStudents, createStudent } from "./api";

// paste firebaseConfig (same values you provided) or set via Vite env
const firebaseConfig = {
  apiKey: "AIzaSyB045oMzQ8jE79nANPa3NOLyX-LlgDoVsw",
  authDomain: "school-management-69b2d.firebaseapp.com",
  projectId: "school-management-69b2d",
  storageBucket: "school-management-69b2d.firebasestorage.app",
  messagingSenderId: "484211256148",
  appId: "1:484211256148:web:d5aede1b41dbe4c75176c1",
  measurementId: "G-J14MX36FV8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', classId: '' });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err) {
      alert('Error fetching students: ' + err.message);
    }
  };

  useEffect(() => {
    if (user) loadStudents();
  }, [user]);

  const login = async () => {
    const email = prompt('admin email?');
    const pw = prompt('password?');
    if (!email || !pw) return;
    await signInWithEmailAndPassword(auth, email, pw);
  };

  const signup = async () => {
    const email = prompt('email?');
    const pw = prompt('password?');
    const name = prompt('display name?');
    if (!email || !pw) return;
    await createUserWithEmailAndPassword(auth, email, pw);
    alert('Created — set role claim from backend or Firebase Console');
  };

  const addStudent = async (e) => {
    e.preventDefault();
    try {
      await createStudent(form);
      setForm({ name: '', email: '', classId: '' });
      await loadStudents();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>School System (Backend API form)</h1>
      {!user ? (
        <div>
          <button onClick={login}>Login</button> <button onClick={signup}>Sign up</button>
        </div>
      ) : (
        <div>
          <div>Signed in as: {user.email} <button onClick={() => auth.signOut()}>Logout</button></div>
          <hr />
          <h2>Students</h2>
          <form onSubmit={addStudent}>
            <input placeholder="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input placeholder="classId" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} />
            <button type="submit">Add Student</button>
          </form>

          <button onClick={loadStudents}>Reload students</button>
          <ul>
            {students.map(s => <li key={s.id}>{s.name} ({s.email}) - class {s.classId}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
