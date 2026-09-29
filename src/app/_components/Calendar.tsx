'use client';

import { useEffect, useState } from 'react';

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
  // 0 = Monday ... 6 = Sunday (ISO-ish starting Monday)
  const d = new Date(Date.UTC(year, month - 1, 1));
  const jsDay = d.getUTCDay(); // 0 = Sunday
  return (jsDay + 6) % 7;
}

function shade(count: number): string {
  if (!count) return '#141414';
  if (count === 1) return '#14401f';
  if (count === 2) return '#1c5e2c';
  if (count === 3) return '#227a37';
  if (count <= 5) return '#28a745';
  return '#34d058';
}

export default function Calendar({
  onDayClick,
}: {
  onDayClick: (date: string, tasks: any[]) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(Number(today.toLocaleString('en-CA', { timeZone: TZ, year: 'numeric' })));
  const [month, setMonth] = useState(Number(today.toLocaleString('en-CA', { timeZone: TZ, month: '2-digit' })));
  const [days, setDays] = useState<Record<string, { completed: number; tasks: any[] }>>({});

  useEffect(() => {
    const m = `${year}-${String(month).padStart(2, '0')}`;
    fetch(`/api/calendar?month=${m}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? {}))
      .catch(() => setDays({}));
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

  return (
    <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={() => {
            const p = shiftMonth(year, month, -1);
            setYear(p.year);
            setMonth(p.month);
          }}
          style={navBtn}
        >
          ‹
        </button>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{monthLabel}</div>
        <button
          onClick={() => {
            const p = shiftMonth(year, month, 1);
            setYear(p.year);
            setMonth(p.month);
          }}
          style={navBtn}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          fontSize: 10,
          color: '#666',
          marginBottom: 4,
          textAlign: 'center',
        }}
      >
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
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
                border: isToday ? '1px solid #eab308' : '1px solid #1a1a1a',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                color: c.count ? '#fff' : '#666',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span>{c.day}</span>
              {c.count > 0 && <span style={{ fontSize: 9, opacity: 0.8 }}>{c.count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #2a2a2a',
  color: '#888',
  borderRadius: 6,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 14,
};