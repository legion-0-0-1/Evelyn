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
        background: 'radial-gradient(ellipse at top, #0f1a2e 0%, #060810 60%)',
        color: '#eaeef5',
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
          background: '#0c1018',
          border: '1px solid #1a2333',
          borderRadius: 18,
          padding: 36,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(96, 165, 250, 0.08)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundImage: 'url(/evelyn.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid #253048',
              boxShadow: '0 0 32px rgba(96, 165, 250, 0.25)',
              marginBottom: 16,
            }}
          />
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Evelyn</div>
          <div style={{ fontSize: 12, color: '#5a6478', marginTop: 4 }}>Enter access code</div>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
          style={{
            width: '100%',
            padding: '11px 14px',
            background: '#060810',
            border: '1px solid #1a2333',
            borderRadius: 10,
            color: '#eaeef5',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            textAlign: 'center',
            letterSpacing: 2,
          }}
        />

        {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 10, textAlign: 'center' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            marginTop: 18,
            padding: '11px 12px',
            background: loading || !password ? '#131822' : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            color: loading || !password ? '#5a6478' : '#060810',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !password ? 'not-allowed' : 'pointer',
            letterSpacing: 0.2,
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