'use client';

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
  const inputStyle: React.CSSProperties = {
    background: '#141414',
    border: '1px solid #1f1f1f',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#e5e5e5',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 20,
        alignItems: 'center',
      }}
    >
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as any })}
        style={inputStyle}
      >
        <option value="active">Active</option>
        <option value="all">All</option>
        <option value="done">Done</option>
        <option value="overdue">Overdue</option>
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as any })}
        style={inputStyle}
      >
        <option value="">Any priority</option>
        <option value="high">High</option>
        <option value="med">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        value={filters.tag}
        onChange={(e) => onChange({ ...filters, tag: e.target.value })}
        style={inputStyle}
      >
        <option value="">Any tag</option>
        {allTags.map((t) => (
          <option key={t} value={t}>
            #{t}
          </option>
        ))}
      </select>

      <input
        placeholder="Search…"
        value={filters.q}
        onChange={(e) => onChange({ ...filters, q: e.target.value })}
        style={{ ...inputStyle, minWidth: 180, flex: 1 }}
      />

      {(filters.priority || filters.tag || filters.q || filters.status !== 'active') && (
        <button
          onClick={() => onChange({ status: 'active', priority: '', tag: '', q: '' })}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#888',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}