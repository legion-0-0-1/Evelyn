'use client';

import { X } from 'lucide-react';
import { fmtIST } from '@/lib/fmt';

export default function DayDrawer({ date, tasks, onClose }: { date: string; tasks: any[]; onClose: () => void }) {
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
          maxWidth: 480,
          background: '#0a0a0c',
          borderLeft: '1px solid #1c1c21',
          height: '100vh',
          overflowY: 'auto',
          padding: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#9a9aa3', fontWeight: 500 }}>{pretty}</div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#5a5a63', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ color: '#3e3e45', fontSize: 13, textAlign: 'center', padding: 40 }}>Nothing on this day.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map((t) => (
              <div
                key={`${t.id}-${t._kind}`}
                style={{
                  background: '#0f0f12',
                  border: '1px solid #1c1c21',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 14, color: '#f0f0f2', fontWeight: 500 }}>
                  <code style={{ color: '#5a5a63', marginRight: 6, fontFamily: 'ui-monospace, monospace' }}>#{t.id}</code>
                  {t.title}
                </div>
                <div style={{ fontSize: 11, color: '#5a5a63', marginTop: 6 }}>
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