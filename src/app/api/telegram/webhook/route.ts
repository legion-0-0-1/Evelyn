import { NextRequest, NextResponse } from 'next/server';
import * as chrono from 'chrono-node';
import {
  addTask,
  getActiveTasks,
  completeTask,
  deleteTask,
  updateTask,
} from '@/lib/sheets';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TZ = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function parseIST(raw: string): Date | null {
  // Get current IST wall-clock date as if it were UTC
  const nowUTC = Date.now();
  const nowISTShifted = new Date(nowUTC + IST_OFFSET_MS);

  // chrono parses against this shifted "now" so relative words (today/tomorrow/9am)
  // land on the correct IST calendar day and clock time.
  const parsedShifted = chrono.parseDate(raw, nowISTShifted, { forwardDate: true });
  if (!parsedShifted) return null;

  // parsedShifted is IST wall-clock labelled as UTC. Subtract offset to get real UTC instant.
  return new Date(parsedShifted.getTime() - IST_OFFSET_MS);
}

async function send(chat_id: string | number, text: string) {
  await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown' }),
  });
}

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

function fmtTask(t: { id: string; title: string; deadline: string; status: string; progress: string }) {
  const dl = t.deadline ? ` — 📅 ${fmtDeadline(t.deadline)}` : '';
  const pr = t.progress ? ` — ${t.progress}` : '';
  return `• \`#${t.id}\` *${t.title}*${dl}${pr}`;
}

function cleanId(raw: string): string {
  return raw.trim().replace(/^#/, '').toLowerCase();
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json();
  const msg = body.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  if (chatId !== ALLOWED_CHAT_ID) {
    await send(chatId, '⛔ Unauthorized.');
    return NextResponse.json({ ok: true });
  }

  const text: string = msg.text.trim();
  const [cmd, ...rest] = text.split(' ');
  const args = rest.join(' ').trim();

  try {
    switch (cmd) {
      case '/start':
        await send(
          chatId,
          `👋 Hi, I'm *Evelyn*.\nYour chat ID: \`${chatId}\`\n\nTry \`/add Call vendor ; tomorrow 5pm\``
        );
        break;

      case '/add': {
        if (!args) {
          await send(chatId, 'Usage: `/add <title> ; <deadline>`');
          break;
        }
        const [title, deadlineRaw] = args.split(';').map((s) => s.trim());
        const parsed = deadlineRaw ? parseIST(deadlineRaw) : null;
        const deadline = parsed ? parsed.toISOString() : '';
        const task = await addTask({ title, deadline });
        await send(chatId, `✅ Added:\n${fmtTask(task)}`);
        break;
      }

      case '/list': {
        const tasks = await getActiveTasks();
        if (!tasks.length) {
          await send(chatId, 'Nothing active. 🎉');
          break;
        }
        await send(chatId, `📋 *Active tasks:*\n\n${tasks.map(fmtTask).join('\n')}`);
        break;
      }

      case '/today': {
        const tasks = await getActiveTasks();
        const now = new Date().toISOString();
        const today = now.slice(0, 10);
        const overdue = tasks.filter((t) => t.deadline && t.deadline < now && !t.deadline.startsWith(today));
        const dueToday = tasks.filter((t) => t.deadline && t.deadline.startsWith(today));
        const upcoming = tasks.filter((t) => !overdue.includes(t) && !dueToday.includes(t));

        let out = '☀️ *Today*\n\n';
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
        const id = cleanId(idRaw);
        const t = await updateTask(id, { progress: note.join(' ') });
        await send(chatId, t ? `📝 Updated:\n${fmtTask(t)}` : '❌ Task not found.');
        break;
      }

      case '/done': {
        if (!args) {
          await send(chatId, 'Usage: `/done <#id>`');
          break;
        }
        const t = await completeTask(cleanId(args));
        await send(chatId, t ? `✅ Done: *${t.title}*` : '❌ Task not found.');
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

      default:
        await send(chatId, `Unknown command. Try /add /list /today /progress /done /delete`);
    }
  } catch (e: any) {
    await send(chatId, `💥 Error: ${e.message}`);
  }

  return NextResponse.json({ ok: true });
}