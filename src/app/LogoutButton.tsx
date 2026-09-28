'use client';

export default function LogoutButton() {
  async function logout(e: React.MouseEvent) {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }
  return (
    <a
      href="/api/logout"
      onClick={logout}
      style={{ color: '#666', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}
    >
      logout
    </a>
  );
}