import { NextRequest, NextResponse } from 'next/server';
import { getActiveTasks, appendLog, logMessage } from '@/lib/sheets';
import { pickGreeting, fmtIST } from '@/lib/greetings';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET!;

const fmt = (t: any) =>
  `• \`#${t.id}\` *${t.title}*${t.deadline ? ` — 📅 ${fmtIST(t.deadline)}` : ''}${
    t.progress ? ` — ${t.progress}` : ''
  }${t.recurrence ? ` — 🔁 ${t.recurrence}` : ''}`;

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

  let text = `${pickGreeting('morning')}\n\n`;
  if (overdue.length) text += `🔴 *Overdue*\n${overdue.map(fmt).join('\n')}\n\n`;
  if (dueToday.length) text += `🟡 *Due today*\n${dueToday.map(fmt).join('\n')}\n\n`;
  if (upcoming.length) text += `🟢 *Upcoming*\n${upcoming.map(fmt).join('\n')}`;
  if (!overdue.length && !dueToday.length && !upcoming.length) text += 'Nothing pending. 🎉';

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  });
  const data = await res.json().catch(() => null);
  if (data?.result?.message_id) {
    try {
      await logMessage(CHAT_ID, data.result.message_id, 'out');
    } catch {}
  }

  await appendLog('digest_sent', '', `${tasks.length} tasks`);
  return NextResponse.json({ ok: true, sent: tasks.length });
}