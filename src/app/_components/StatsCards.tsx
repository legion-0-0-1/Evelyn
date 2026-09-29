'use client';

import { useEffect, useState } from 'react';
import { ListTodo, AlertTriangle, CalendarDays, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import type { Stats } from '@/lib/types';

export default function StatsCards({ refreshKey }: { refreshKey: any }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, [refreshKey]);

  const items: { label: string; value: number | string; color: string; bg: string; Icon: any }[] = stats
    ? [
        { label: 'Active', value: stats.active, color: '#f0f0f2', bg: '#25252b', Icon: ListTodo },
        { label: 'Overdue', value: stats.overdue, color: '#f87171', bg: '#2a1214', Icon: AlertTriangle },
        { label: 'Due today', value: stats.dueToday, color: '#fbbf24', bg: '#2a1f0a', Icon: CalendarDays },
        { label: 'Done this week', value: stats.completedThisWeek, color: '#22c55e', bg: '#0f2a1a', Icon: CheckCircle2 },
        { label: 'Completion', value: `${stats.completionRate}%`, color: '#60a5fa', bg: '#0f1a2a', Icon: TrendingUp },
        { label: 'Streak', value: stats.streak, color: '#f97316', bg: '#2a1a0a', Icon: Flame },
      ]
    : Array(6).fill(null).map((_, i) => ({ label: '', value: '', color: '', bg: '', Icon: null, _skeleton: true, _i: i })) as any;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {items.map((c: any, i: number) => (
        <Card key={i} {...c} loading={!stats} />
      ))}
    </div>
  );
}

function Card({ label, value, color, bg, Icon, loading }: any) {
  if (loading) {
    return (
      <div
        style={{
          background: '#0f0f12',
          border: '1px solid #1c1c21',
          borderRadius: 14,
          padding: '16px 18px',
          minHeight: 82,
        }}
      >
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 50, height: 20, marginBottom: 4 }} />
        <div className="skeleton" style={{ width: 70, height: 10 }} />
      </div>
    );
  }
  return (
    <div
      className="fade-in"
      style={{
        background: '#0f0f12',
        border: '1px solid #1c1c21',
        borderRadius: 14,
        padding: '16px 18px',
        transition: 'all 0.18s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#25252b';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1c1c21';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color, letterSpacing: -0.5, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontSize: 10,
          color: '#5a5a63',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}