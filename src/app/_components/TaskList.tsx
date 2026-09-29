'use client';

import { useState } from 'react';
import { Repeat2, Circle } from 'lucide-react';
import TaskDrawer from './TaskDrawer';
import { fmtIST, priorityColor, statusColor, parseTags } from '@/lib/fmt';

type Props = {
  tasks: any[];
  loading: boolean;
  onRefresh: () => void;
  onTagClick: (tag: string) => void;
  view: 'list' | 'kanban';
};

export default function TaskList({ tasks, loading, onRefresh, onTagClick, view }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div
        className="fade-in"
        style={{
          padding: 60,
          textAlign: 'center',
          color: '#5a5a63',
          fontSize: 13,
          background: '#0f0f12',
          border: '1px dashed #25252b',
          borderRadius: 14,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>✦</div>
        <div style={{ fontWeight: 500, color: '#9a9aa3', marginBottom: 4 }}>Nothing here</div>
        <div>Add tasks from Telegram with <code style={{ color: '#22c55e' }}>/add</code></div>
      </div>
    );
  }

  if (view === 'kanban') {
    const cols = [
      { key: 'todo', label: 'To Do', color: '#9a9aa3' },
      { key: 'in-progress', label: 'In Progress', color: '#f59e0b' },
      { key: 'done', label: 'Done', color: '#22c55e' },
    ];
    return (
      <>
        <div
          className="fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}
        >
          {cols.map((c) => {
            const items = tasks.filter((t) => t.status === c.key);
            return (
              <div
                key={c.key}
                style={{
                  background: '#0f0f12',
                  border: '1px solid #1c1c21',
                  borderRadius: 14,
                  padding: 14,
                  minHeight: 400,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: c.color }} />
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                      {c.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#5a5a63',
                      background: '#16161a',
                      padding: '2px 7px',
                      borderRadius: 10,
                      fontWeight: 500,
                    }}
                  >
                    {items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((t) => (
                    <KanbanCard key={t.id} t={t} onClick={() => setOpenId(t.id)} onTagClick={onTagClick} />
                  ))}
                  {items.length === 0 && (
                    <div style={{ color: '#3e3e45', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>—</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {openId && <TaskDrawer taskId={openId} onClose={() => setOpenId(null)} onChanged={onRefresh} />}
      </>
    );
  }

  return (
    <>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t) => (
          <TaskRow key={t.id} t={t} onClick={() => setOpenId(t.id)} onTagClick={onTagClick} />
        ))}
      </div>
      {openId && <TaskDrawer taskId={openId} onClose={() => setOpenId(null)} onChanged={onRefresh} />}
    </>
  );
}

function TaskRow({ t, onClick, onTagClick }: { t: any; onClick: () => void; onTagClick: (tag: string) => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#0f0f12',
        border: '1px solid #1c1c21',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#25252b';
        e.currentTarget.style.background = '#121215';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1c1c21';
        e.currentTarget.style.background = '#0f0f12';
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: statusColor(t.status),
          flexShrink: 0,
          boxShadow: t.status === 'done' ? `0 0 0 3px rgba(34, 197, 94, 0.15)` : 'none',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: t.status === 'done' ? 'line-through' : 'none',
            color: t.status === 'done' ? '#5a5a63' : '#f0f0f2',
            letterSpacing: -0.1,
          }}
        >
          {t.title}
        </div>
        <div style={{ fontSize: 11, color: '#5a5a63', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>#{t.id}</span>
          {t.deadline && <span>· {fmtIST(t.deadline)}</span>}
          {t.progress && <span>· {t.progress}</span>}
          {t.subtaskTotal > 0 && (
            <span>
              · {t.subtaskDone}/{t.subtaskTotal} subtasks
            </span>
          )}
        </div>
      </div>

      {t.recurrence && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 5,
            background: '#0f2a1a',
            color: '#22c55e',
            fontWeight: 500,
          }}
        >
          <Repeat2 size={10} />
          {t.recurrence}
        </span>
      )}

      {parseTags(t.tags).map((tag: string) => (
        <span
          key={tag}
          onClick={(e) => {
            e.stopPropagation();
            onTagClick(tag);
          }}
          style={{
            fontSize: 10,
            padding: '3px 8px',
            borderRadius: 5,
            background: '#0f1a2a',
            color: '#60a5fa',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          #{tag}
        </span>
      ))}

      <span
        style={{
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 5,
          background: '#16161a',
          color: priorityColor(t.priority),
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        {t.priority}
      </span>
    </div>
  );
}

function KanbanCard({ t, onClick, onTagClick }: { t: any; onClick: () => void; onTagClick: (tag: string) => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#16161a',
        border: '1px solid #25252b',
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#33333b';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#25252b';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, letterSpacing: -0.1, color: '#f0f0f2' }}>{t.title}</div>
      <div style={{ fontSize: 10, color: '#5a5a63', marginBottom: 8, fontFamily: 'ui-monospace, monospace' }}>
        #{t.id}
        {t.deadline && ` · ${fmtIST(t.deadline)}`}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {parseTags(t.tags).map((tag: string) => (
          <span
            key={tag}
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag);
            }}
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 4,
              background: '#0f1a2a',
              color: '#60a5fa',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            #{tag}
          </span>
        ))}
        <span
          style={{
            fontSize: 9,
            padding: '2px 6px',
            borderRadius: 4,
            background: '#0a0a0c',
            color: priorityColor(t.priority),
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {t.priority}
        </span>
      </div>
    </div>
  );
}