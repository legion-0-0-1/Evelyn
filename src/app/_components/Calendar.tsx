'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TZ = 'Asia/Kolkata';

function ymd(date: Date) {
  return date
    .toLocaleString('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-');
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function firstWeekdayOfMonth(year: number, month: number) {
  const d = new Date(Date.UTC(year, month - 1, 1));
  return (d.getUTCDay() + 6) % 7;
}

function shade(count: number): string {
  if (!count) return '#16161a';
  if (count === 1) return '#0f2a1a';
  if (count === 2) return '#14572d';
  if (count === 3) return '#1a7a3c';
  if (count <= 5) return '#22c55e';
  return '#4ade80';
}

export default function Calendar({ onDayClick }: { onDayClick: (date: string, tasks: any[]) => void }) {
  const today = new Date();
  const [year, setYear] = useState(Number(today.toLocaleString('en-CA', { timeZone: TZ, year: 'numeric' })));
  const [month, setMonth] = useState(Number(today.toLocaleString('en-CA', { timeZone: TZ, month: '2-digit' })));
  const [days, setDays] = useState<Record<string, { completed: number; tasks: any[] }>>({});

  useEffect(() => {
    const m = `${year}-${String(month).padStart(2, '0')}`;
    fetch(`/api/calendar?month=${m}`).then((r) => r.json()).then((d) => setDays(d.days ?? {})).catch(() => setDays({}));
  }, [year, month]);

  const total = daysInMonth(year, month);
  const offset = firstWeekdayOfMonth(year, month);
  const todayKey = ymd(new Date());

  const cells: ({ day: number | null; key: string; count: number } | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, key, count: days[key]?.completed ?? 0 });
  }

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const totalDone = Object.values(days).reduce((a, b) => a + b.completed, 0);

  return (
    <div
      style={{
        background: '#0f0f12',
        border: '1px solid #1c1c21',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.2 }}>{monthLabel}</div>
          <div style={{ fontSize: 11, color: '#5a5a63', marginTop: 2 }}>
            {totalDone} completed
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavBtn onClick={() => { const p = shiftMonth(year, month, -1); setYear(p.year); setMonth(p.month); }}>
            <ChevronLeft size={14} />
          </NavBtn>
          <NavBtn onClick={() => { const p = shiftMonth(year, month, 1); setYear(p.year); setMonth(p.month); }}>
            <ChevronRight size={14} />
          </NavBtn>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          fontSize: 10,
          color: '#3e3e45',
          marginBottom: 6,
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}
      >
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const isToday = c.key === todayKey;
          return (
            <div
              key={c.key}
              onClick={() => onDayClick(c.key, days[c.key]?.tasks ?? [])}
              title={`${c.key}: ${c.count} completed`}
              style={{
                aspectRatio: '1',
                background: shade(c.count),
                border: isToday ? '1.5px solid #22c55e' : '1px solid transparent',
                boxShadow: isToday ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'none',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                color: c.count ? '#f0f0f2' : '#5a5a63',
                fontWeight: c.count ? 600 : 400,
                transition: 'all 0.14s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.borderColor = '#22c55e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (!isToday) e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span>{c.day}</span>
              {c.count > 0 && <span style={{ fontSize: 8, opacity: 0.85, marginTop: 1 }}>{c.count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 26,
        height: 26,
        background: 'transparent',
        border: '1px solid #25252b',
        color: '#9a9aa3',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}