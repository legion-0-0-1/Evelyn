'use client';

import { useState } from 'react';
import TaskDrawer from './TaskDrawer';
import { fmtIST, priorityColor, statusColor, parseTags } from '@/lib/fmt';
import type { FilterState } from './Dashboard';

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
          <div
            key={i}
            className="skeleton"
            style={{ height: 60, borderRadius: 8 }}
          />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div
        className="fade-in"
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#555',
          fontSize: 14,
          background: '#141414',
          border: '1px dashed #1f1f1f',
          borderRadius: 10,
        }}
      >
        Nothing here yet. Add a task from Telegram →{' '}
        <code style={{ color: '#888' }}>/add Buy groceries ; tomorrow 6pm</code>
      </div>
    );
  }

  if (view === 'kanban') {
    const cols = [
      { key: 'todo', label: 'To Do' },
      { key: 'in-progress', label: 'In Progress' },
      { key: 'done', label: 'Done' },
    ];
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="fade-in">
          {cols.map((c) => {
            const items = tasks.filter((t) => t.status === c.key);
            return (
              <div
                key={c.key}
                style={{
                  background: '#0f0f0f',
                  border: '1px solid #1f1f1f',
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 200,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 10,
                  }}
                >
                  {c.label} · {items.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((t) => (
                    <KanbanCard key={t.id} t={t} onClick={() => setOpenId(t.id)} onTagClick={onTagClick} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {openId && (
          <TaskDrawer
            taskId={openId}
            onClose={() => setOpenId(null)}
            onChanged={() => onRefresh()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.background = '#181818';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1f1f1f';
              e.currentTarget.style.background = '#141414';
            }}
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

            {t.recurrence && <Chip text={`🔁 ${t.recurrence}`} color="#4ade80" bg="#1a2e1a" />}

            {parseTags(t.tags).map((tag: string) => (
              <Chip
                key={tag}
                text={`#${tag}`}
                color="#93c5fd"
                bg="#1e1e2e"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
              />
            ))}

            <Chip text={t.priority} color={priorityColor(t.priority)} bg="#1f1f1f" />
          </div>
        ))}
      </div>

      {openId && (
        <TaskDrawer
          taskId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => onRefresh()}
        />
      )}
    </>
  );
}

function Chip({
  text,
  color,
  bg,
  onClick,
}: {
  text: string;
  color: string;
  bg: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 4,
        background: bg,
        color,
        textTransform: 'uppercase',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {text}
    </span>
  );
}

function KanbanCard({
  t,
  onClick,
  onTagClick,
}: {
  t: any;
  onClick: () => void;
  onTagClick: (tag: string) => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 8,
        padding: 10,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
    >
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
        <code>#{t.id}</code>
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
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 3,
              background: '#1e1e2e',
              color: '#93c5fd',
              cursor: 'pointer',
            }}
          >
            #{tag}
          </span>
        ))}
        <span
          style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: '#1f1f1f',
            color: priorityColor(t.priority),
            textTransform: 'uppercase',
          }}
        >
          {t.priority}
        </span>
      </div>
    </div>
  );
}