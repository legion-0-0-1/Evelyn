import Dashboard from './_components/Dashboard';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', padding: '40px 32px 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundImage: 'url(/evelyn.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid #253048',
                boxShadow: '0 0 24px rgba(96, 165, 250, 0.2), inset 0 0 0 1px rgba(255,255,255,0.05)',
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  background: 'linear-gradient(135deg, #eaeef5 0%, #8b95a8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Evelyn
              </div>
              <div style={{ fontSize: 12, color: '#5a6478', marginTop: 2, letterSpacing: 0.2 }}>
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