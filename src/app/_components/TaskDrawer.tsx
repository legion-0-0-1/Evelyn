'use client';

import { useEffect, useState } from 'react';
import { fmtIST, priorityColor } from '@/lib/fmt';
import type { Subtask } from '@/lib/types';

export default function TaskDrawer({
  taskId,
  onClose,
  onChanged,
}: {
  taskId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [task, setTask] = useState<any>(null);
  const [subs, setSubs] = useState<Subtask[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks?status=all`)
      .then((r) => r.json())
      .then((d) => {
        const t = d.tasks.find((x: any) => x.id === taskId);
        setTask(t);
      });
    fetch(`/api/subtasks?task_id=${taskId}`)
      .then((r) => r.json())
      .then((d) => setSubs(d.subtasks ?? []))
      .catch(() => setSubs([]));
  }, [taskId]);

  async function toggleSub(order: number, done: boolean) {
    setBusy(true);
    await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, order, done }),
    });
    setBusy(false);
    const r = await fetch(`/api/subtasks?task_id=${taskId}`).then((x) => x.json());
    setSubs(r.subtasks ?? []);
    onChanged();
  }

  if (!task) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#0f0f0f',
          borderLeft: '1px solid #1f1f1f',
          height: '100vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <code style={{ color: '#888', fontSize: 12 }}>#{task.id}</code>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{task.title}</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <Badge text={task.status} />
          <Badge text={task.priority} color={priorityColor(task.priority)} />
          {task.recurrence && <Badge text={`🔁 ${task.recurrence}`} color="#4ade80" />}
          {task.tags &&
            task.tags.split(',').filter(Boolean).map((t: string) => (
              <Badge key={t} text={`#${t}`} color="#93c5fd" />
            ))}
        </div>

        {task.description && (
          <Field label="Description">
            <p style={{ margin: 0, color: '#ccc', fontSize: 14, whiteSpace: 'pre-wrap' }}>{task.description}</p>
          </Field>
        )}

        {task.deadline && (
          <Field label="Deadline">
            <span style={{ color: '#ccc', fontSize: 14 }}>{fmtIST(task.deadline)}</span>
          </Field>
        )}

        {task.progress && (
          <Field label="Progress">
            <span style={{ color: '#ccc', fontSize: 14 }}>{task.progress}</span>
          </Field>
        )}

        <Field label="Created">
          <span style={{ color: '#888', fontSize: 13 }}>{fmtIST(task.created_at)}</span>
        </Field>

        {task.completed_at && (
          <Field label="Completed">
            <span style={{ color: '#16a34a', fontSize: 13 }}>{fmtIST(task.completed_at)}</span>
          </Field>
        )}

        {subs.length > 0 && (
          <Field label={`Subtasks (${subs.filter((s) => s.done).length}/${subs.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subs.map((s) => (
                <label
                  key={s.order}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    color: s.done ? '#666' : '#ccc',
                    fontSize: 14,
                    textDecoration: s.done ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={s.done}
                    disabled={busy}
                    onChange={(e) => toggleSub(s.order, e.target.checked)}
                  />
                  {s.text}
                </label>
              ))}
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: '#666',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 4,
        background: '#1a1a1a',
        color: color ?? '#a3a3a3',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  );
}