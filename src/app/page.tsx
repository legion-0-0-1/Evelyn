import Dashboard from './_components/Dashboard';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#0a0a0a',
        color: '#e5e5e5',
        minHeight: '100vh',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
              Evelyn <span style={{ color: '#16a34a' }}>●</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
              Everyday Virtual Executive for Lists &amp; Your Nudges
            </p>
          </div>
          <LogoutButton />
        </header>

        <Dashboard />
      </div>
    </main>
  );
}