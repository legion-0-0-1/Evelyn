'use client';

import { useState } from 'react';
import TaskDrawer from './TaskDrawer';
import { fmtIST, priorityColor, statusColor } from '@/lib/fmt';

export default function TaskList({
  tasks,
  loading,
  onRefresh,
}: {
  tasks: any[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <div style={{ color: '#666', padding: 20 }}>Loading…</div>;
  if (!tasks.length) return <div style={{ color: '#666', padding: 20, textAlign: 'center' }}>No tasks match.</div>;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => setOpenId(t.id)}
            style={{
              background: '#141414',
              border: '1px solid #1f1f1f',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: statusColor(t.status),
                flexShrink: 0,
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
                  color: t.status === 'done' ? '#777' : '#e5e5e5',
                }}
              >
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                <code style={{ color: '#666' }}>#{t.id}</code>
                {t.deadline && ` · ${fmtIST(t.deadline)}`}
                {t.progress && ` · ${t.progress}`}
                {t.subtaskTotal > 0 && ` · ${t.subtaskDone}/${t.subtaskTotal} subtasks`}
              </div>
            </div>

            {t.recurrence && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#1a2e1a',
                  color: '#4ade80',
                }}
              >
                🔁 {t.recurrence}
              </span>
            )}

            {t.tags &&
              t.tags.split(',').filter(Boolean).map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#1e1e2e',
                    color: '#93c5fd',
                  }}
                >
                  #{tag}
                </span>
              ))}

            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#1f1f1f',
                color: priorityColor(t.priority),
                textTransform: 'uppercase',
              }}
            >
              {t.priority}
            </span>
          </div>
        ))}
      </div>

      {openId && (
        <TaskDrawer
          taskId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => {
            onRefresh();
          }}
        />
      )}
    </>
  );
}