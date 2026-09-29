'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS: Record<string, string> = {
  high: '#f87171',
  med: '#a3a3a3',
  low: '#737373',
};

export default function Charts() {
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((d) => {
        setTrend(d.trend ?? []);
        setPriorityCounts(d.priorityCounts ?? {});
      })
      .catch(() => {});
  }, []);

  const pieData = Object.entries(priorityCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v, color: PIE_COLORS[k] ?? '#666' }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
      <div
        style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Completions — last 30 days
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trend}>
            <CartesianGrid stroke="#1f1f1f" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#555"
              fontSize={10}
              tickFormatter={(v) => v.slice(5)}
              interval={4}
            />
            <YAxis stroke="#555" fontSize={10} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#0f0f0f',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: '#888' }}
            />
            <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ fontSize: 12, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          By priority
        </div>
        {pieData.length === 0 ? (
          <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 30 }}>No tasks</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}