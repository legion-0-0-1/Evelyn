'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { theme } from '@/lib/theme';

const PIE_COLORS: Record<string, string> = {
  high: '#f87171',
  med: '#9a9aa3',
  low: '#5a5a63',
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

  const total = pieData.reduce((a, b) => a + b.value, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div
        style={{
          background: '#0f0f12',
          border: '1px solid #1c1c21',
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#5a5a63',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 500,
          }}
        >
          Completions · last 30 days
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1c1c21" vertical={false} />
            <XAxis dataKey="date" stroke="#3e3e45" fontSize={10} tickFormatter={(v) => v.slice(5)} interval={4} axisLine={false} tickLine={false} />
            <YAxis stroke="#3e3e45" fontSize={10} allowDecimals={false} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{
                background: '#16161a',
                border: '1px solid #25252b',
                borderRadius: 8,
                fontSize: 12,
                color: '#f0f0f2',
              }}
              labelStyle={{ color: '#9a9aa3', fontSize: 11 }}
              cursor={{ stroke: '#25252b' }}
            />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          background: '#0f0f12',
          border: '1px solid #1c1c21',
          borderRadius: 14,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#5a5a63',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 500,
          }}
        >
          By priority
        </div>
        {pieData.length === 0 ? (
          <div style={{ color: '#3e3e45', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>No tasks yet</div>
        ) : (
          <>
            <div style={{ position: 'relative', flex: 1 }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} stroke="none">
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#16161a',
                      border: '1px solid #25252b',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#f0f0f2',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{total}</div>
                <div style={{ fontSize: 9, color: '#5a5a63', textTransform: 'uppercase', letterSpacing: 0.5 }}>tasks</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ color: '#9a9aa3', textTransform: 'capitalize', flex: 1 }}>{d.name}</span>
                  <span style={{ color: '#f0f0f2', fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}