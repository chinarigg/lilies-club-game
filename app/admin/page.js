'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [users, setUsers] = useState(null);

  async function login(e) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      setMsg('senha errada');
      return;
    }
    setAuthed(true);
    loadUsers();
  }

  async function loadUsers() {
    const res = await fetch('/api/admin');
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users);
  }

  return (
    <>
      <header className="site">
        <img src="/logo.png" alt="Lilie's Club" />
        <a href="https://www.chinaritcg.com.br">← voltar pra loja</a>
      </header>

      <div className="wrap">
        <h1>painel do clube</h1>
        <span className="underline"></span>

        {!authed && (
          <div className="card">
            <form onSubmit={login}>
              <div className="field">
                <label htmlFor="password">senha de admin</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="primary" type="submit">
                entrar
              </button>
            </form>
            <p className="msg bad">{msg}</p>
          </div>
        )}

        {authed && users && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>e-mail</th>
                  <th>sequência</th>
                  <th>recorde</th>
                  <th>hoje</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td>{u.streak}</td>
                    <td>{u.best}</td>
                    <td>
                      {u.last_result_date && String(u.last_result_date).slice(0, 10) === todayLocalIso()
                        ? u.last_result === 'correct'
                          ? 'acertou'
                          : 'errou'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function todayLocalIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10);
}
