'use client';

import { useEffect, useState } from 'react';
import { X, Check, Trash2, Plus } from 'lucide-react';
import { fmtIST, priorityColor, parseTags } from '@/lib/fmt';
import type { Subtask } from '@/lib/types';

const inputStyle: React.CSSProperties = {
  background: '#0a0a0c',
  border: '1px solid #25252b',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#f0f0f2',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function TaskDrawer({ taskId, onClose, onChanged }: { taskId: string; onClose: () => void; onChanged: () => void }) {
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
      const d = new Date(draft);
      if (!isNaN(d.getTime())) value = d.toISOString();
    }
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
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="drawer-in"
        style={{
          width: '100%',
          maxWidth: 500,
          background: '#0a0a0c',
          borderLeft: '1px solid #1c1c21',
          height: '100vh',
          overflowY: 'auto',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <code style={{ color: '#5a5a63', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>#{taskId}</code>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#5a5a63',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {!task ? (
          <div>
            <div className="skeleton" style={{ width: '70%', height: 26, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 24 }} />
            <div className="skeleton" style={{ width: '100%', height: 60 }} />
          </div>
        ) : (
          <>
            <EditableField
              value={task.title}
              editing={editing === 'title'}
              draft={draft}
              onChange={setDraft}
              onSave={() => saveEdit('title')}
              onCancel={() => setEditing(null)}
              onStart={() => startEdit('title', task.title)}
              big
            />

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              <Badge text={task.status} />
              <Badge text={task.priority} color={priorityColor(task.priority)} />
              {task.recurrence && <Badge text={`🔁 ${task.recurrence}`} color="#22c55e" />}
              {parseTags(task.tags).map((t) => (
                <Badge key={t} text={`#${t}`} color="#60a5fa" />
              ))}
            </div>

            <Field label="Description" onEdit={() => startEdit('description', task.description)}>
              {editing === 'description' ? (
                <InlineEditor value={draft} onChange={setDraft} onSave={() => saveEdit('description')} onCancel={() => setEditing(null)} multiline busy={busy} />
              ) : (
                <span style={{ color: task.description ? '#c8c8cf' : '#3e3e45', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                  {task.description || 'Add a description…'}
                </span>
              )}
            </Field>

            <Field label="Priority">
              {editing === 'priority' ? (
                <select value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => saveEdit('priority')} autoFocus style={inputStyle}>
                  <option value="high">high</option>
                  <option value="med">med</option>
                  <option value="low">low</option>
                </select>
              ) : (
                <span
                  onClick={() => startEdit('priority', task.priority)}
                  style={{
                    color: priorityColor(task.priority),
                    fontSize: 13,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  {task.priority}
                </span>
              )}
            </Field>

            <Field label="Deadline" onEdit={() => startEdit('deadline', task.deadline)}>
              {editing === 'deadline' ? (
                <InlineEditor value={draft} onChange={setDraft} onSave={() => saveEdit('deadline')} onCancel={() => setEditing(null)} placeholder="2026-10-01 08:00" busy={busy} />
              ) : (
                <span style={{ color: task.deadline ? '#c8c8cf' : '#3e3e45', fontSize: 14 }}>
                  {task.deadline ? fmtIST(task.deadline) : 'Set a deadline…'}
                </span>
              )}
            </Field>

            <Field label="Progress" onEdit={() => startEdit('progress', task.progress)}>
              {editing === 'progress' ? (
                <InlineEditor value={draft} onChange={setDraft} onSave={() => saveEdit('progress')} onCancel={() => setEditing(null)} busy={busy} />
              ) : (
                <span style={{ color: task.progress ? '#c8c8cf' : '#3e3e45', fontSize: 14 }}>{task.progress || 'Add progress…'}</span>
              )}
            </Field>

            <Field label="Tags" onEdit={() => startEdit('tags', task.tags)}>
              {editing === 'tags' ? (
                <InlineEditor value={draft} onChange={setDraft} onSave={() => saveEdit('tags')} onCancel={() => setEditing(null)} placeholder="work,home" busy={busy} />
              ) : (
                <span style={{ color: task.tags ? '#c8c8cf' : '#3e3e45', fontSize: 14 }}>{task.tags || 'Add tags…'}</span>
              )}
            </Field>

            <Field label="Created">
              <span style={{ color: '#5a5a63', fontSize: 12 }}>{fmtIST(task.created_at)}</span>
            </Field>

            {task.completed_at && (
              <Field label="Completed">
                <span style={{ color: '#22c55e', fontSize: 12 }}>{fmtIST(task.completed_at)}</span>
              </Field>
            )}

            <Field label={`Subtasks · ${subs.filter((s) => s.done).length}/${subs.length}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {subs.map((s) => (
                  <div
                    key={s.order}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      fontSize: 13,
                      color: s.done ? '#5a5a63' : '#c8c8cf',
                      textDecoration: s.done ? 'line-through' : 'none',
                      padding: '6px 0',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={s.done}
                      disabled={busy}
                      onChange={(e) => toggleSub(s.order, e.target.checked)}
                      style={{ accentColor: '#22c55e', cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1 }}>{s.text}</span>
                    <button
                      onClick={() => delSub(s.order)}
                      disabled={busy}
                      style={{ background: 'transparent', border: 'none', color: '#5a5a63', cursor: 'pointer', display: 'flex', padding: 4 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Add subtask…"
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSub()}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={addSub}
                  disabled={busy || !newSub.trim()}
                  style={{
                    background: '#22c55e',
                    color: '#08080a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </Field>

            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              {task.status !== 'done' && (
                <button
                  onClick={complete}
                  disabled={busy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#22c55e',
                    color: '#08080a',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} />
                  Complete
                </button>
              )}
              <button
                onClick={del}
                disabled={busy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  color: '#f87171',
                  border: '1px solid #2a1214',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: '#5a5a63', fontWeight: 600 }}>{label}</div>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ background: 'transparent', border: 'none', color: '#5a5a63', fontSize: 11, cursor: 'pointer', padding: 0 }}
          >
            edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EditableField({ value, editing, draft, onChange, onSave, onCancel, onStart, big }: any) {
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
        style={{ ...inputStyle, fontSize: big ? 20 : 14, fontWeight: big ? 600 : 400, marginBottom: 14 }}
      />
    );
  }
  return (
    <h2
      onClick={onStart}
      style={{
        margin: '0 0 14px',
        fontSize: big ? 22 : 14,
        fontWeight: big ? 600 : 400,
        letterSpacing: big ? -0.4 : 0,
        cursor: 'text',
        lineHeight: 1.3,
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
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={onSave}
          disabled={busy}
          style={{
            background: '#22c55e',
            color: '#08080a',
            border: 'none',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'transparent',
            border: '1px solid #25252b',
            color: '#9a9aa3',
            borderRadius: 6,
            padding: '5px 12px',
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
        fontSize: 10,
        padding: '4px 9px',
        borderRadius: 5,
        background: '#16161a',
        color: color ?? '#9a9aa3',
        textTransform: 'uppercase',
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {text}
    </span>
  );
}