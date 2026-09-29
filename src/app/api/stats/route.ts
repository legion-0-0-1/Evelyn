import { NextRequest, NextResponse } from 'next/server';
import { getTasks, getLogs } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const tasks = await getTasks();
  const logs = await getLogs();
  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const weekAhead = new Date(now.getTime() + 7 * 86400000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const active = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const overdue = active.filter((t) => t.deadline && t.deadline < nowIso && !t.deadline.startsWith(today));
  const dueToday = active.filter((t) => t.deadline && t.deadline.startsWith(today));
  const dueThisWeek = active.filter((t) => t.deadline && t.deadline >= nowIso && t.deadline <= weekAhead);

  const completions = logs.filter(
    (l) => l.action === 'task_completed' || l.action === 'task_completed_recurring'
  );
  const completedThisWeek = completions.filter((l) => l.timestamp >= weekAgo).length;
  const completedThisMonth = completions.filter((l) => l.timestamp >= monthAgo).length;

  const completionDays = new Set(completions.map((l) => l.timestamp.slice(0, 10)));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (completionDays.has(key)) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }

  const total = tasks.length;
  const completionRate = total ? Math.round((done.length / total) * 100) : 0;

  return NextResponse.json({
    total,
    active: active.length,
    done: done.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    dueThisWeek: dueThisWeek.length,
    completedThisWeek,
    completedThisMonth,
    completionRate,
    streak,
  });
}