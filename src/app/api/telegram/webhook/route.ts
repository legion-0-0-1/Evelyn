import { NextRequest, NextResponse } from 'next/server';
import {
  addTask,
  getActiveTasks,
  completeTask,
  deleteTask,
  updateTask,
  logMessage,
  getRecentOutgoingMessageIds,
  clearMessageLog,
  getSetting,
  setSetting,
} from '@/lib/sheets';
import { getBucket, pickGreeting, istDateKey, fmtIST, parseIST } from '@/lib/greetings';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function send(chat_id: string | number, text: string) {
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown' }),
  });
  const data = await res.json().catch(() => null);
  if (data?.result?.message_id) {
    try {
      await logMessage(String(chat_id), data.result.message_id, 'out');
    } catch {}
  }
}

async function maybeGreet(chatId: string): Promise<string> {
  const bucket = getBucket();
  const key = `last_greeted_${bucket}`;
  const today = istDateKey();
  const last = await getSetting(key);
  if (last === today) return '';
  await setSetting(key, today);
  return pickGreeting(bucket) + '\n\n';
}

function fmtTask(t: {
  id: string;
  title: string;
  deadline: string;
  progress: string;
  recurrence: string;
}) {
  const dl = t.deadline ? ` — 📅 ${fmtIST(t.deadline)}` : '';
  const pr = t.progress ? ` — ${t.progress}` : '';
  const rc = t.recurrence ? ` — 🔁 ${t.recurrence}` : '';
  return `• \`#${t.id}\` *${t.title}*${dl}${pr}${rc}`;
}

function cleanId(raw: string): string {
  return raw.trim().replace(/^#/, '').toLowerCase();
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const msg = body.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  if (chatId !== ALLOWED_CHAT_ID) {
    await send(chatId, '⛔ Unauthorized.');
    return NextResponse.json({ ok: true });
  }

  try {
    if (msg.message_id) await logMessage(chatId, msg.message_id, 'in');
  } catch {}

  const text: string = msg.text.trim();
  const [cmd, ...rest] = text.split(' ');
  const args = rest.join(' ').trim();

  try {
    switch (cmd) {
      case '/start': {
        const greet = await maybeGreet(chatId);
        await send(
          chatId,
          `${greet}👋 I'm *Evelyn*. Your chat ID: \`${chatId}\`\n\nTry \`/add Call vendor ; tomorrow 5pm\``
        );
        break;
      }

      case '/add': {
        if (!args) {
          await send(chatId, 'Usage: `/add <title> ; <deadline> ; [recurrence]`');
          break;
        }
        const parts = args.split(';').map((s) => s.trim());
        const [title, deadlineRaw, recurrence] = parts;
        const parsed = deadlineRaw ? parseIST(deadlineRaw) : null;
        const deadline = parsed ? parsed.toISOString() : '';
        const task = await addTask({ title, deadline, recurrence });
        await send(chatId, `✅ Added:\n${fmtTask(task)}`);
        break;
      }

      case '/list': {
        const greet = await maybeGreet(chatId);
        const tasks = await getActiveTasks();
        if (!tasks.length) {
          await send(chatId, `${greet}Nothing active. 🎉`);
          break;
        }
        await send(chatId, `${greet}📋 *Active tasks:*\n\n${tasks.map(fmtTask).join('\n')}`);
        break;
      }

      case '/today': {
        const greet = await maybeGreet(chatId);
        const tasks = await getActiveTasks();
        const now = new Date().toISOString();
        const today = now.slice(0, 10);
        const overdue = tasks.filter((t) => t.deadline && t.deadline < now && !t.deadline.startsWith(today));
        const dueToday = tasks.filter((t) => t.deadline && t.deadline.startsWith(today));
        const upcoming = tasks.filter((t) => !overdue.includes(t) && !dueToday.includes(t));
        let out = `${greet}☀️ *Today*\n\n`;
        if (overdue.length) out += `🔴 *Overdue*\n${overdue.map(fmtTask).join('\n')}\n\n`;
        if (dueToday.length) out += `🟡 *Due today*\n${dueToday.map(fmtTask).join('\n')}\n\n`;
        if (upcoming.length) out += `🟢 *Upcoming*\n${upcoming.map(fmtTask).join('\n')}`;
        if (!overdue.length && !dueToday.length && !upcoming.length) out += 'Nothing. 🎉';
        await send(chatId, out);
        break;
      }

      case '/progress': {
        const [idRaw, ...note] = args.split(' ');
        if (!idRaw || !note.length) {
          await send(chatId, 'Usage: `/progress <#id> <note or %>`');
          break;
        }
        const t = await updateTask(cleanId(idRaw), { progress: note.join(' ') });
        await send(chatId, t ? `📝 Updated:\n${fmtTask(t)}` : '❌ Task not found.');
        break;
      }

      case '/done': {
        if (!args) {
          await send(chatId, 'Usage: `/done <#id>`');
          break;
        }
        const result = await completeTask(cleanId(args));
        if (!result) {
          await send(chatId, '❌ Task not found.');
          break;
        }
        if (result.recurring) {
          await send(
            chatId,
            `🔁 Done. Rescheduled to *${fmtIST(result.task.deadline)}*:\n${fmtTask(result.task)}`
          );
        } else {
          await send(chatId, `✅ Done: *${result.task.title}*`);
        }
        break;
      }

      case '/delete': {
        if (!args) {
          await send(chatId, 'Usage: `/delete <#id>`');
          break;
        }
        const ok = await deleteTask(cleanId(args));
        await send(chatId, ok ? '🗑️ Deleted.' : '❌ Task not found.');
        break;
      }

      case '/clear': {
        const n = args ? Math.min(Math.max(Number(args), 1), 100) : 20;
        if (isNaN(n)) {
          await send(chatId, 'Usage: `/clear [count]` (1–100, default 20)');
          break;
        }
        const ids = await getRecentOutgoingMessageIds(chatId, n);
        let deleted = 0;
        for (const id of ids) {
          const r = await fetch(`${TG_API}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: id }),
          });
          const d = await r.json().catch(() => null);
          if (d?.ok) deleted++;
        }
        await clearMessageLog(chatId);
        // Send a fresh confirmation (which itself will get logged — clear it right after)
        await send(chatId, `🧹 Cleared ${deleted} message${deleted === 1 ? '' : 's'}.`);
        break;
      }

      case '/help':
      default: {
        await send(
          chatId,
          [
            '*Evelyn commands*',
            '`/add <title> ; <deadline> ; [recurrence]`',
            '  recurrence: daily · weekly · monthly · monthly first monday · monthly last friday · every 3 days',
            '`/list` — active tasks',
            '`/today` — today + overdue + upcoming',
            '`/progress <#id> <note>`',
            '`/done <#id>` — non-recurring completes; recurring reschedules',
            '`/delete <#id>`',
            '`/clear [count]` — delete last N bot messages (default 20, max 100)',
          ].join('\n')
        );
      }
    }
  } catch (e: any) {
    await send(chatId, `💥 Error: ${e.message}`);
  }

  return NextResponse.json({ ok: true });
}