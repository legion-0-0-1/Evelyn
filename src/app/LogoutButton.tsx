'use client';

import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  async function logout(e: React.MouseEvent) {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }
  return (
    <button
      onClick={logout}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: '1px solid #25252b',
        color: '#9a9aa3',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}