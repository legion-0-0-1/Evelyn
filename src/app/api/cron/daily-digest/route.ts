import { NextRequest, NextResponse } from 'next/server';
import { getActiveTasks, appendLog, logMessage } from '@/lib/sheets';
import { pickGreeting, fmtIST } from '@/lib/greetings';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET!;
const TZ = 'Asia/Kolkata';

function istNow(): { weekday: number; ymd: string } {
  const now = new Date();
  const wd = Number(now.toLocaleString('en-US', { weekday: 'short', timeZone: TZ }) === 'Mon' ? 1 : 0); // placeholder
  // simpler: derive weekday via parts
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' }).format(now);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = map[parts] ?? 0;
  const ymd = now.toLocaleString('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  return { weekday, ymd };
}

function fmtTask(t: any) {
  return `• \`#${t.id}\` *${t.title}*${t.deadline ? ` — 📅 ${fmtIST(t.deadline)}` : ''}${
    t.progress ? ` — ${t.progress}` : ''
  }${t.recurrence ? ` — 🔁 ${t.recurrence}` : ''}`;
}

function buildDaily(tasks: any[]): string {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const overdue = tasks.filter((t) => t.deadline && t.deadline < now && !t.deadline.startsWith(today));
  const dueToday = tasks.filter((t) => t.deadline && t.deadline.startsWith(today));
  const dueTomorrow = tasks.filter((t) => t.deadline && t.deadline.startsWith(tomorrow));

  let out = '';
  if (overdue.length) out += `🔴 *Overdue*\n${overdue.map(fmtTask).join('\n')}\n\n`;
  if (dueToday.length) out += `🟡 *Due today*\n${dueToday.map(fmtTask).join('\n')}\n\n`;
  if (dueTomorrow.length) out += `🟢 *Due tomorrow*\n${dueTomorrow.map(fmtTask).join('\n')}`;
  if (!overdue.length && !dueToday.length && !dueTomorrow.length) out = 'Nothing urgent. 🎉';
  return out;
}

function buildWeekly(tasks: any[]): string {
  const now = new Date();
  const todayIst = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const days: { label: string; key: string; tasks: any[] }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(todayIst);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    days.push({ label, key, tasks: [] });
  }

  const later: any[] = [];
  for (const t of tasks) {
    if (!t.deadline) { later.push(t); continue; }
    const key = t.deadline.slice(0, 10);
    const day = days.find((d) => d.key === key);
    if (day) day.tasks.push(t);
    else later.push(t);
  }

  let out = '';
  for (const d of days) {
    if (!d.tasks.length) continue;
    out += `*${d.label}*\n${d.tasks.map(fmtTask).join('\n')}\n\n`;
  }
  if (later.length) out += `*Later*\n${later.map(fmtTask).join('\n')}`;
  if (!out) out = 'Nothing scheduled this week. 🎉';
  return out;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tasks = await getActiveTasks();
  const { weekday } = istNow();
  const isMonday = weekday === 1;

  const body = isMonday
    ? `☀️ *Your week ahead*\n\n${buildWeekly(tasks)}`
    : buildDaily(tasks);

  const text = `${pickGreeting('morning')}\n\n${body}`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  });
  const data = await res.json().catch(() => null);
  if (data?.result?.message_id) {
    try { await logMessage(CHAT_ID, data.result.message_id, 'out'); } catch {}
  }

  await appendLog('digest_sent', '', `${tasks.length} tasks · ${isMonday ? 'weekly' : 'daily'}`);
  return NextResponse.json({ ok: true, sent: tasks.length, mode: isMonday ? 'weekly' : 'daily' });
}