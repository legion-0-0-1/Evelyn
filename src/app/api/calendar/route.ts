import { NextRequest, NextResponse } from 'next/server';
import { getTasks, getLogs } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

const TZ = 'Asia/Kolkata';

function istYMD(iso: string): string {
  // convert any ISO to IST calendar day
  const d = new Date(iso);
  return d
    .toLocaleString('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // YYYY-MM

  const [tasks, logs] = await Promise.all([getTasks(), getLogs()]);

  const tasksByDay: Record<string, any[]> = {};
  for (const t of tasks) {
    if (t.completed_at) {
      const k = istYMD(t.completed_at);
      (tasksByDay[k] ??= []).push({ ...t, _kind: 'completed' });
    }
    if (t.created_at) {
      const k = istYMD(t.created_at);
      (tasksByDay[k] ??= []).push({ ...t, _kind: 'created' });
    }
  }

  const completionsByDay: Record<string, number> = {};
  for (const l of logs) {
    if (l.action === 'task_completed' || l.action === 'task_completed_recurring') {
      const k = istYMD(l.timestamp);
      completionsByDay[k] = (completionsByDay[k] ?? 0) + 1;
    }
  }

  // Optional month filter for the day map
  let days: Record<string, { completed: number; tasks: any[] }> = {};
  for (const k of Object.keys(completionsByDay)) {
    days[k] = { completed: completionsByDay[k], tasks: tasksByDay[k] ?? [] };
  }

  if (month) {
    const filtered: typeof days = {};
    for (const k of Object.keys(days)) if (k.startsWith(month)) filtered[k] = days[k];
    days = filtered;
  }

  // Last 30 days trend (always full range, not month-filtered)
  const trend: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const k = d.toLocaleString('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    trend.push({ date: k, count: completionsByDay[k] ?? 0 });
  }

  // Priority split
  const priorityCounts: Record<string, number> = { high: 0, med: 0, low: 0 };
  for (const t of tasks) priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;

  return NextResponse.json({ days, trend, priorityCounts });
}