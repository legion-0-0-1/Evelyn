'use client';

import { useEffect, useState } from 'react';
import StatsCards from './StatsCards';
import Filters from './Filters';
import TaskList from './TaskList';
import Calendar from './Calendar';
import Charts from './Charts';
import DayDrawer from './DayDrawer';

export type FilterState = {
  status: 'all' | 'active' | 'done' | 'overdue';
  priority: '' | 'low' | 'med' | 'high';
  tag: string;
  q: string;
};

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    status: 'active',
    priority: '',
    tag: '',
    q: '',
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayView, setDayView] = useState<{ date: string; tasks: any[] } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.tag) params.set('tag', filters.tag);
      if (filters.q) params.set('q', filters.q);
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks);

      if (!allTags.length) {
        const all = await fetch('/api/tasks?status=all').then((r) => r.json());
        const set = new Set<string>();
        for (const t of all.tasks) {
          if (t.tags) t.tags.split(',').map((x: string) => x.trim()).filter(Boolean).forEach((x: string) => set.add(x));
        }
        setAllTags(Array.from(set).sort());
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <>
      <StatsCards refreshKey={filters} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Calendar onDayClick={(date, tasks) => setDayView({ date, tasks })} />
        <Charts />
      </div>

      <Filters filters={filters} onChange={setFilters} allTags={allTags} />

      {error && (
        <div
          style={{
            padding: 16,
            background: '#2a0f0f',
            border: '1px solid #7f1d1d',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <TaskList tasks={tasks} loading={loading} onRefresh={load} />

      {dayView && <DayDrawer date={dayView.date} tasks={dayView.tasks} onClose={() => setDayView(null)} />}
    </>
  );
}