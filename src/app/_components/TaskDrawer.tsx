'use client';

import { useEffect, useState } from 'react';
import { fmtIST, priorityColor, parseTags } from '@/lib/fmt';
import type { Subtask } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#e5e5e5',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

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
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [newSub, setNewSub] = useState('');

  async function refresh() {
    const t = await fetch(`/api/tasks/${taskId}`).then((r) => r.json());
    setTask(t.task ?? null);
    const s = await fetch(`/api/subtasks?task_id=${taskId}`).then((r) => r.json());
    setSubs(s.subtasks ?? []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function startEdit(field: string, current: string) {
    setEditing(field);
    setDraft(current ?? '');
  }

  async function saveEdit(field: string) {
    setBusy(true);
    let value: any = draft;
    if (field === 'deadline') {
      // accept natural language? skip — plain ISO or YYYY-MM-DD HH:MM accepted.
      // try Date parse first
      const d = new Date(draft);
      if (!isNaN(d.getTime())) value = d.toISOString();
    }
    if (field === 'tags') value = draft;
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setBusy(false);
    setEditing(null);
    await refresh();
    onChanged();
  }

  async function complete() {
    if (!confirm('Mark this task as done?')) return;
    setBusy(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    setBusy(false);
    onChanged();
    onClose();
  }

  async function del() {
    if (!confirm('Delete this task permanently?')) return;
    setBusy(true);
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setBusy(false);
    onChanged();
    onClose();
  }

  async function toggleSub(order: number, done: boolean) {
    setBusy(true);
    await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, order, done }),
    });
    setBusy(false);
    await refresh();
    onChanged();
  }

  async function delSub(order: number) {
    setBusy(true);
    await fetch('/api/subtasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, order }),
    });
    setBusy(false);
    await refresh();
    onChanged();
  }

  async function addSub() {
    if (!newSub.trim()) return;
    setBusy(true);
    await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, text: newSub.trim() }),
    });
    setNewSub('');
    setBusy(false);
    await refresh();
    onChanged();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="drawer-in"
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <code style={{ color: '#888', fontSize: 12 }}>#{taskId}</code>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: 22,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {!task ? (
          <div>
            <div className="skeleton" style={{ width: '70%', height: 24, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 24 }} />
            <div className="skeleton" style={{ width: '100%', height: 60 }} />
          </div>
        ) : (
          <>
            {/* Title */}
            <EditableField
              value={task.title}
              editing={editing === 'title'}
              draft={draft}
              busy={busy}
              onStart={() => startEdit('title', task.title)}
              onChange={setDraft}
              onSave={() => saveEdit('title')}
              onCancel={() => setEditing(null)}
              big
            />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <Badge text={task.status} />
              <Badge text={task.priority} color={priorityColor(task.priority)} />
              {task.recurrence && <Badge text={`🔁 ${task.recurrence}`} color="#4ade80" />}
              {parseTags(task.tags).map((t) => (
                <Badge key={t} text={`#${t}`} color="#93c5fd" />
              ))}
            </div>

            {/* Description */}
            <Field label="Description" onEdit={() => startEdit('description', task.description)}>
              {editing === 'description' ? (
                <InlineEditor
                  value={draft}
                  onChange={setDraft}
                  onSave={() => saveEdit('description')}
                  onCancel={() => setEditing(null)}
                  multiline
                  busy={busy}
                />
              ) : (
                <span style={{ color: task.description ? '#ccc' : '#555', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                  {task.description || 'Add a description…'}
                </span>
              )}
            </Field>

            {/* Priority */}
            <Field label="Priority">
              {editing === 'priority' ? (
                <select
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit('priority')}
                  autoFocus
                  style={inputStyle}
                >
                  <option value="high">high</option>
                  <option value="med">med</option>
                  <option value="low">low</option>
                </select>
              ) : (
                <span
                  onClick={() => startEdit('priority', task.priority)}
                  style={{ color: priorityColor(task.priority), fontSize: 14, cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {task.priority}
                </span>
              )}
            </Field>

            {/* Deadline */}
            <Field label="Deadline" onEdit={() => startEdit('deadline', task.deadline)}>
              {editing === 'deadline' ? (
                <InlineEditor
                  value={draft}
                  onChange={setDraft}
                  onSave={() => saveEdit('deadline')}
                  onCancel={() => setEditing(null)}
                  placeholder="2026-10-01 08:00 or ISO"
                  busy={busy}
                />
              ) : (
                <span style={{ color: task.deadline ? '#ccc' : '#555', fontSize: 14 }}>
                  {task.deadline ? fmtIST(task.deadline) : 'Set a deadline…'}
                </span>
              )}
            </Field>

            {/* Progress */}
            <Field label="Progress" onEdit={() => startEdit('progress', task.progress)}>
              {editing === 'progress' ? (
                <InlineEditor
                  value={draft}
                  onChange={setDraft}
                  onSave={() => saveEdit('progress')}
                  onCancel={() => setEditing(null)}
                  busy={busy}
                />
              ) : (
                <span style={{ color: task.progress ? '#ccc' : '#555', fontSize: 14 }}>
                  {task.progress || 'Add progress…'}
                </span>
              )}
            </Field>

            {/* Tags */}
            <Field label="Tags" onEdit={() => startEdit('tags', task.tags)}>
              {editing === 'tags' ? (
                <InlineEditor
                  value={draft}
                  onChange={setDraft}
                  onSave={() => saveEdit('tags')}
                  onCancel={() => setEditing(null)}
                  placeholder="work,home,health (comma-separated)"
                  busy={busy}
                />
              ) : (
                <span style={{ color: task.tags ? '#ccc' : '#555', fontSize: 14 }}>
                  {task.tags || 'Add tags…'}
                </span>
              )}
            </Field>

            <Field label="Created">
              <span style={{ color: '#888', fontSize: 13 }}>{fmtIST(task.created_at)}</span>
            </Field>

            {task.completed_at && (
              <Field label="Completed">
                <span style={{ color: '#16a34a', fontSize: 13 }}>{fmtIST(task.completed_at)}</span>
              </Field>
            )}

            {/* Subtasks */}
            <Field label={`Subtasks (${subs.filter((s) => s.done).length}/${subs.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {subs.map((s) => (
                  <div
                    key={s.order}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      fontSize: 14,
                      color: s.done ? '#666' : '#ccc',
                      textDecoration: s.done ? 'line-through' : 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={s.done}
                      disabled={busy}
                      onChange={(e) => toggleSub(s.order, e.target.checked)}
                    />
                    <span style={{ flex: 1 }}>{s.text}</span>
                    <button
                      onClick={() => delSub(s.order)}
                      disabled={busy}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  placeholder="Add subtask…"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSub()}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addSub} disabled={busy || !newSub.trim()} style={primaryBtn}>
                  +
                </button>
              </div>
            </Field>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              {task.status !== 'done' && (
                <button onClick={complete} disabled={busy} style={primaryBtn}>
                  ✓ Complete
                </button>
              )}
              <button onClick={del} disabled={busy} style={dangerBtn}>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  onEdit,
}: {
  label: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#666',
          }}
        >
          {label}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#555',
              fontSize: 11,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EditableField({
  value,
  editing,
  draft,
  onChange,
  onSave,
  onCancel,
  onStart,
  busy,
  big,
}: any) {
  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        onBlur={onSave}
        autoFocus
        style={{ ...inputStyle, fontSize: big ? 20 : 14, fontWeight: big ? 600 : 400, marginBottom: 12 }}
      />
    );
  }
  return (
    <h2
      onClick={onStart}
      style={{
        margin: '0 0 12px',
        fontSize: big ? 20 : 14,
        fontWeight: big ? 600 : 400,
        cursor: 'text',
      }}
    >
      {value}
    </h2>
  );
}

function InlineEditor({ value, onChange, onSave, onCancel, placeholder, multiline, busy }: any) {
  return (
    <div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={placeholder}
          autoFocus
          style={inputStyle}
        />
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button onClick={onSave} disabled={busy} style={{ ...primaryBtn, padding: '4px 12px', fontSize: 12 }}>
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#888',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
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

const primaryBtn: React.CSSProperties = {
  background: '#16a34a',
  color: '#0a0a0a',
  border: 'none',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#f87171',
  border: '1px solid #7f1d1d',
  borderRadius: 6,
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
};