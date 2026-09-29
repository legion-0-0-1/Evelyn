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

  const cards: { label: string; value: number | string; color?: string }[] = stats
    ? [
        { label: 'Active', value: stats.active },
        { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
        { label: 'Due today', value: stats.dueToday, color: '#eab308' },
        { label: 'This week', value: stats.completedThisWeek, color: '#16a34a' },
        { label: 'Rate', value: `${stats.completionRate}%` },
        { label: 'Streak', value: stats.streak, color: '#f97316' },
      ]
    : [
        { label: 'Active', value: 0 },
        { label: 'Overdue', value: 0 },
        { label: 'Due today', value: 0 },
        { label: 'This week', value: 0 },
        { label: 'Rate', value: '—' },
        { label: 'Streak', value: 0 },
      ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {cards.map((c, i) => (
        <Card key={i} label={c.label} value={c.value} color={c.color} loading={!stats} />
      ))}
    </div>
  );
}

function Card({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 10,
        padding: '14px 16px',
        minHeight: 68,
        transition: 'background 0.15s',
      }}
    >
      {loading ? (
        <>
          <div className="skeleton" style={{ width: 40, height: 22, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 60, height: 10 }} />
        </>
      ) : (
        <div className="fade-in">
          <div style={{ fontSize: 22, fontWeight: 600, color: color ?? '#e5e5e5' }}>{value}</div>
          <div
            style={{
              fontSize: 11,
              color: '#888',
              marginTop: 2,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </div>
        </div>
      )}
    </div>
  );
}