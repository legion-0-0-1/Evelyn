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
  const [view, setView] = useState<'list' | 'kanban'>('list');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('status', view === 'kanban' ? 'all' : filters.status);
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
  }, [filters, view]);

  return (
    <>
      <StatsCards refreshKey={filters} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.1fr) minmax(0, 1.9fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Calendar onDayClick={(date, tasks) => setDayView({ date, tasks })} />
        <Charts />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Filters filters={filters} onChange={setFilters} allTags={allTags} />
        <div
          style={{
            display: 'flex',
            gap: 2,
            flexShrink: 0,
            background: '#0f0f12',
            border: '1px solid #1c1c21',
            borderRadius: 8,
            padding: 3,
          }}
        >
          <ViewBtn active={view === 'list'} onClick={() => setView('list')}>
            List
          </ViewBtn>
          <ViewBtn active={view === 'kanban'} onClick={() => setView('kanban')}>
            Kanban
          </ViewBtn>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            background: '#2a0f0f',
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            color: '#fca5a5',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        onRefresh={load}
        onTagClick={(tag) => setFilters({ ...filters, tag })}
        view={view}
      />

      {dayView && <DayDrawer date={dayView.date} tasks={dayView.tasks} onClose={() => setDayView(null)} />}
    </>
  );
}

function ViewBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#16161a' : 'transparent',
        color: active ? '#f0f0f2' : '#5a5a63',
        border: 'none',
        borderRadius: 6,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}