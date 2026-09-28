'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') ?? '/';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace(from);
      router.refresh();
    } else {
      setError('Wrong code.');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui',
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: 12,
          padding: 32,
          width: '100%',
          maxWidth: 340,
        }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 600 }}>
          Evelyn <span style={{ color: '#16a34a' }}>●</span>
        </h1>
        <p style={{ margin: '0 0 24px', color: '#888', fontSize: 13 }}>Enter access code</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#0a0a0a',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            color: '#e5e5e5',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '10px 12px',
            background: loading || !password ? '#1f1f1f' : '#16a34a',
            color: loading || !password ? '#666' : '#0a0a0a',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !password ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}