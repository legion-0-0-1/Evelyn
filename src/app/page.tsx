import { getTasks } from '@/lib/sheets';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

const TZ = 'Asia/Kolkata';

function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
}

function statusColor(s: string) {
  if (s === 'done') return '#16a34a';
  if (s === 'in-progress') return '#d97706';
  return '#6b7280';
}

export default async function Home() {
  let tasks: Awaited<ReturnType<typeof getTasks>> = [];
  let error: string | null = null;

  try {
    tasks = await getTasks();
  } catch (e: any) {
    error = e.message ?? 'Failed to load tasks';
  }

  const active = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const overdue = active.filter((t) => t.deadline && t.deadline < now && !t.deadline.startsWith(today));
  const dueToday = active.filter((t) => t.deadline && t.deadline.startsWith(today));

  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#0a0a0a',
        color: '#e5e5e5',
        minHeight: '100vh',
        padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <header
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
              Evelyn <span style={{ color: '#16a34a' }}>●</span>
            </h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
              Everyday Virtual Executive for Lists &amp; Your Nudges
            </p>
          </div>
          <LogoutButton />
        </header>

        {error ? (
          <div
            style={{
              padding: 16,
              background: '#2a0f0f',
              border: '1px solid #7f1d1d',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: 14,
            }}
          >
            <strong>Sheet error:</strong> {error}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 32,
              }}
            >
              <Stat label="Active" value={active.length} />
              <Stat label="Overdue" value={overdue.length} color="#ef4444" />
              <Stat label="Due today" value={dueToday.length} color="#eab308" />
              <Stat label="Completed" value={done.length} color="#16a34a" />
            </div>

            <Section title="Active tasks">
              {active.length === 0 ? (
                <Empty text="Nothing active. 🎉" />
              ) : (
                active.map((t) => (
                  <TaskRow
                    key={t.id}
                    id={t.id}
                    title={t.title}
                    deadline={t.deadline}
                    status={t.status}
                    priority={t.priority}
                    progress={t.progress}
                  />
                ))
              )}
            </Section>

            <Section title="Completed">
              {done.length === 0 ? (
                <Empty text="Nothing completed yet." />
              ) : (
                done
                  .slice(-10)
                  .reverse()
                  .map((t) => (
                    <TaskRow
                      key={t.id}
                      id={t.id}
                      title={t.title}
                      deadline={t.completed_at}
                      status={t.status}
                      priority={t.priority}
                      progress={t.progress}
                    />
                  ))
              )}
            </Section>

            <footer
              style={{
                marginTop: 40,
                fontSize: 12,
                color: '#666',
                borderTop: '1px solid #1f1f1f',
                paddingTop: 16,
              }}
            >
              {tasks.length} total tasks · refreshed {new Date().toLocaleTimeString('en-IN', { timeZone: TZ })}
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 10,
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 600, color: color ?? '#e5e5e5' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#888',
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function TaskRow({
  id,
  title,
  deadline,
  status,
  priority,
  progress,
}: {
  id: string;
  title: string;
  deadline: string;
  status: string;
  priority: string;
  progress: string;
}) {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: 8,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: statusColor(status),
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
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
          <code style={{ color: '#666' }}>#{id}</code>
          {deadline && ` · ${fmtDate(deadline)}`}
          {progress && ` · ${progress}`}
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 4,
          background: '#1f1f1f',
          color: priority === 'high' ? '#f87171' : priority === 'low' ? '#737373' : '#a3a3a3',
          textTransform: 'uppercase',
        }}
      >
        {priority}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#555', fontSize: 13 }}>{text}</div>
  );
}