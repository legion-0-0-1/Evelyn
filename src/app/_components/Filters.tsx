'use client';

import { Search, X } from 'lucide-react';
import type { FilterState } from './Dashboard';

export default function Filters({
  filters,
  onChange,
  allTags,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  allTags: string[];
}) {
  const selectStyle: React.CSSProperties = {
    background: '#0f0f12',
    border: '1px solid #1c1c21',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#f0f0f2',
    fontSize: 13,
    outline: 'none',
    appearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a5a63' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 30,
    cursor: 'pointer',
  };

  const hasFilter = filters.priority || filters.tag || filters.q || filters.status !== 'active';

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value as any })} style={selectStyle}>
        <option value="active">Active</option>
        <option value="all">All</option>
        <option value="done">Done</option>
        <option value="overdue">Overdue</option>
      </select>

      <select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value as any })} style={selectStyle}>
        <option value="">Priority</option>
        <option value="high">High</option>
        <option value="med">Medium</option>
        <option value="low">Low</option>
      </select>

      <select value={filters.tag} onChange={(e) => onChange({ ...filters, tag: e.target.value })} style={selectStyle}>
        <option value="">Tag</option>
        {allTags.map((t) => (
          <option key={t} value={t}>#{t}</option>
        ))}
      </select>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 160,
          maxWidth: 320,
        }}
      >
        <Search
          size={14}
          color="#5a5a63"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          placeholder="Search tasks…"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          style={{
            width: '100%',
            background: '#0f0f12',
            border: '1px solid #1c1c21',
            borderRadius: 8,
            padding: '9px 12px 9px 34px',
            color: '#f0f0f2',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {hasFilter && (
        <button
          onClick={() => onChange({ status: 'active', priority: '', tag: '', q: '' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: '1px solid #1c1c21',
            color: '#9a9aa3',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}