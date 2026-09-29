'use client';

import { fmtIST } from '@/lib/fmt';

export default function DayDrawer({
  date,
  tasks,
  onClose,
}: {
  date: string;
  tasks: any[];
  onClose: () => void;
}) {
  const pretty = new Date(date + 'T12:00:00Z').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

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
          <div style={{ fontSize: 14, color: '#888' }}>{pretty}</div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ color: '#555', fontSize: 13 }}>Nothing on this day.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map((t) => (
              <div
                key={`${t.id}-${t._kind}`}
                style={{
                  background: '#141414',
                  border: '1px solid #1f1f1f',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 14, color: '#e5e5e5' }}>
                  <code style={{ color: '#666', marginRight: 6 }}>#{t.id}</code>
                  {t.title}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  {t._kind === 'completed' ? `✅ completed ${fmtIST(t.completed_at)}` : `✏️ created ${fmtIST(t.created_at)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}