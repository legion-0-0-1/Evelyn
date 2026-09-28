import { NextRequest, NextResponse } from 'next/server';
import { getActiveTasks, appendLog } from '@/lib/sheets';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET!;
const TZ = 'Asia/Kolkata';

function fmtDeadline(iso: string): string {
  if (!iso) return '';
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

const fmt = (t: any) =>
  `• \`#${t.id}\` *${t.title}*${t.deadline ? ` — 📅 ${fmtDeadline(t.deadline)}` : ''}${
    t.progress ? ` — ${t.progress}` : ''
  }`;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tasks = await getActiveTasks();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const overdue = tasks.filter((t) => t.deadline && t.deadline < now && !t.deadline.startsWith(today));
  const dueToday = tasks.filter((t) => t.deadline && t.deadline.startsWith(today));
  const upcoming = tasks.filter((t) => !overdue.includes(t) && !dueToday.includes(t));

  let text = '☀️ *Good morning — here is your day*\n\n';
  if (overdue.length) text += `🔴 *Overdue*\n${overdue.map(fmt).join('\n')}\n\n`;
  if (dueToday.length) text += `🟡 *Due today*\n${dueToday.map(fmt).join('\n')}\n\n`;
  if (upcoming.length) text += `🟢 *Upcoming*\n${upcoming.map(fmt).join('\n')}`;
  if (!overdue.length && !dueToday.length && !upcoming.length) text += 'Nothing pending. 🎉';

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  });

  await appendLog('digest_sent', '', `${tasks.length} tasks`);

  return NextResponse.json({ ok: true, sent: tasks.length });
}