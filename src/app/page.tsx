import Dashboard from './_components/Dashboard';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 32px 80px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: '#08080a',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
              }}
            >
              E
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Evelyn</div>
              <div style={{ fontSize: 12, color: '#5a5a63', marginTop: 1 }}>
                Everyday Virtual Executive
              </div>
            </div>
          </div>
          <LogoutButton />
        </header>

        <Dashboard />
      </div>
    </main>
  );
}