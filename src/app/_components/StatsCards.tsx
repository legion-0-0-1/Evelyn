'use client';

import { useEffect, useState } from 'react';
import type { Stats } from '@/lib/types';

export default function StatsCards({ refreshKey }: { refreshKey: any }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [refreshKey]);

  if (!stats) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      <Card label="Active" value={stats.active} />
      <Card label="Overdue" value={stats.overdue} color="#ef4444" />
      <Card label="Due today" value={stats.dueToday} color="#eab308" />
      <Card label="This week" value={stats.completedThisWeek} color="#16a34a" />
      <Card label="Rate" value={`${stats.completionRate}%`} />
      <Card label="Streak" value={stats.streak} color="#f97316" />
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 600, color: color ?? '#e5e5e5' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}