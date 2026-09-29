import { NextRequest, NextResponse } from 'next/server';
import {
  addTask,
  getActiveTasks,
  getTasks,
  completeTask,
  deleteTask,
  updateTask,
  logMessage,
  getRecentOutgoingMessageIds,
  clearMessageLog,
  getSetting,
  setSetting,
  getLogs,
  getSubtasks,
  addSubtask,
  setSubtaskDone,
  deleteSubtask,
  parseTags,
  taskTags,
  type Task,
} from '@/lib/sheets';
import { getBucket, pickGreeting, istDateKey, fmtIST, parseIST } from '@/lib/greetings';
import { extractModifiers, parseDuration } from '@/lib/parse';

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
    try { await logMessage(String(chat_id), data.result.message_id, 'out'); } catch {}
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

function fmtTask(t: Task) {
  const dl = t.deadline ? ` — 📅 ${fmtIST(t.deadline)}` : '';
  const pr = t.progress ? ` — ${t.progress}` : '';
  const rc = t.recurrence ? ` — 🔁 ${t.recurrence}` : '';
  const tg = t.tags ? ` — ${parseTags(t.tags).map((x) => `#${x}`).join(' ')}` : '';
  const pf = t.priority === 'high' ? ' 🔺' : t.priority === 'low' ? ' 🔽' : '';
  return `• \`#${t.id}\` *${t.title}*${pf}${dl}${pr}${rc}${tg}`;
}

function cleanId(raw: string): string {
  return raw.trim().replace(/^#/, '');
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

  try { if (msg.message_id) await logMessage(chatId, msg.message_id, 'in'); } catch {}

  const text: string = msg.text.trim();
  const [cmd, ...rest] = text.split(' ');
  const args = rest.join(' ').trim();

  try {
    switch (cmd) {
      case '/start': {
        const greet = await maybeGreet(chatId);
        await send(chatId, `${greet}👋 I'm *Evelyn*. Your chat ID: \`${chatId}\`\n\nTry \`/add Call vendor ; tomorrow 5pm !high #work\``);
        break;
      }

      case '/add': {
        if (!args) {
          await send(chatId, 'Usage: `/add <title> ; <deadline> ; [recurrence]`\nModifiers: `!high` `!low`, `#tag`');
          break;
        }
        const pre = extractModifiers(args);
        const parts = pre.title.split(';').map((s) => s.trim());
        const [title, deadlineRaw, recurrence] = parts;
        const dl = deadlineRaw ? parseIST(deadlineRaw) : null;
        const task = await addTask({
          title,
          deadline: dl ? dl.toISOString() : '',
          priority: pre.priority,
          recurrence,
          tags: pre.tags,
        });
        await send(chatId, `✅ Added:\n${fmtTask(task)}`);
        break;
      }

      case '/list': {
        const greet = await maybeGreet(chatId);
        const tasks = await getActiveTasks();
        if (!tasks.length) { await send(chatId, `${greet}Nothing active. 🎉`); break; }
        const lines: string[] = [];
        for (const t of tasks) {
          lines.push(fmtTask(t));
          const subs = await getSubtasks(t.id);
          if (subs.length) {
            const doneCount = subs.filter((s) => s.done).length;
            lines.push(`   └ ${doneCount}/${subs.length} subtasks`);
          }
        }
        await send(chatId, `${greet}📋 *Active tasks:*\n\n${lines.join('\n')}`);
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
        if (!idRaw || !note.length) { await send(chatId, 'Usage: `/progress <#id> <note or %>`'); break; }
        const t = await updateTask(cleanId(idRaw), { progress: note.join(' ') });
        await send(chatId, t ? `📝 Updated:\n${fmtTask(t)}` : '❌ Task not found.');
        break;
      }

      case '/done': {
        if (!args) { await send(chatId, 'Usage: `/done <#id>`'); break; }
        const id = cleanId(args);
        const subs = await getSubtasks(id);
        const open = subs.filter((s) => !s.done);
        if (open.length) {
          await send(
            chatId,
            `⚠️ *${open.length}* open subtask${open.length === 1 ? '' : 's'}:\n${open.map((s) => `· ${s.text}`).join('\n')}\n\nSend \`/done ${id} force\` to complete anyway.`
          );
          break;
        }
        const result = await completeTask(id);
        if (!result) { await send(chatId, '❌ Task not found.'); break; }
        if (result.recurring) {
          await send(chatId, `🔁 Done. Rescheduled to *${fmtIST(result.task.deadline)}*:\n${fmtTask(result.task)}`);
        } else {
          await send(chatId, `✅ Done: *${result.task.title}*`);
        }
        break;
      }

      case '/delete': {
        if (!args) { await send(chatId, 'Usage: `/delete <#id>`'); break; }
        const ok = await deleteTask(cleanId(args));
        await send(chatId, ok ? '🗑️ Deleted.' : '❌ Task not found.');
        break;
      }

      case '/priority': {
        const [idRaw, level] = args.split(' ');
        const lv = (level || '').toLowerCase();
        if (!idRaw || !['high', 'med', 'low'].includes(lv)) {
          await send(chatId, 'Usage: `/priority <#id> high|med|low`');
          break;
        }
        const t = await updateTask(cleanId(idRaw), { priority: lv as any });
        await send(chatId, t ? `🔺 Priority set:\n${fmtTask(t)}` : '❌ Task not found.');
        break;
      }

      case '/snooze': {
        const [idRaw, durRaw] = args.split(' ');
        if (!idRaw || !durRaw) { await send(chatId, 'Usage: `/snooze <#id> <1h|2d|1w>`'); break; }
        const ms = parseDuration(durRaw);
        if (!ms) { await send(chatId, '❌ Bad duration. Try `1h`, `2d`, `1w`.'); break; }
        const id = cleanId(idRaw);
        const tasks = await getTasks();
        const task = tasks.find((t) => t.id === id);
        if (!task) { await send(chatId, '❌ Task not found.'); break; }
        const base = task.deadline ? new Date(task.deadline) : new Date();
        const next = new Date(base.getTime() + ms);
        const t = await updateTask(id, { deadline: next.toISOString() });
        await send(chatId, t ? `💤 Snoozed to ${fmtIST(next.toISOString())}:\n${fmtTask(t)}` : '❌ Failed.');
        break;
      }

      case '/edit': {
        const firstSpace = args.indexOf(' ');
        if (firstSpace === -1) { await send(chatId, 'Usage: `/edit <#id> <field> <value>`'); break; }
        const idRaw = args.slice(0, firstSpace);
        const remainder = args.slice(firstSpace + 1).trim();
        const fieldSpace = remainder.indexOf(' ');
        if (fieldSpace === -1) { await send(chatId, 'Usage: `/edit <#id> <field> <value>`'); break; }
        const field = remainder.slice(0, fieldSpace).toLowerCase();
        const value = remainder.slice(fieldSpace + 1).trim();
        const id = cleanId(idRaw);
        let patch: any = {};
        if (field === 'title') patch.title = value;
        else if (field === 'description' || field === 'desc') patch.description = value;
        else if (field === 'progress') patch.progress = value;
        else if (field === 'tags') patch.tags = value.split(/\s+/).map((t) => t.replace(/^#/, '').toLowerCase());
        else if (field === 'deadline') {
          const d = parseIST(value);
          if (!d) { await send(chatId, '❌ Could not parse deadline.'); break; }
          patch.deadline = d.toISOString();
        } else { await send(chatId, '❌ Unknown field. Try title, deadline, description, progress, tags.'); break; }
        const t = await updateTask(id, patch);
        await send(chatId, t ? `✏️ Updated:\n${fmtTask(t)}` : '❌ Task not found.');
        break;
      }

      case '/search': {
        if (!args) { await send(chatId, 'Usage: `/search <query>`'); break; }
        const q = args.toLowerCase();
        const all = await getTasks();
        const hits = all
          .filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
          .slice(0, 20);
        if (!hits.length) { await send(chatId, 'No matches.'); break; }
        await send(chatId, `🔎 *${hits.length} match${hits.length === 1 ? '' : 'es'}*\n\n${hits.map(fmtTask).join('\n')}`);
        break;
      }

      case '/tags': {
        const tasks = await getTasks();
        const counts: Record<string, number> = {};
        for (const t of tasks) for (const tag of taskTags(t)) counts[tag] = (counts[tag] ?? 0) + 1;
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (!sorted.length) { await send(chatId, 'No tags yet.'); break; }
        await send(chatId, `🏷️ *Tags*\n\n${sorted.map(([tag, n]) => `#${tag} — ${n}`).join('\n')}`);
        break;
      }

      case '/tag': {
        if (!args) { await send(chatId, 'Usage: `/tag <tag>`'); break; }
        const tag = args.replace(/^#/, '').toLowerCase();
        const tasks = await getActiveTasks();
        const hits = tasks.filter((t) => taskTags(t).includes(tag));
        if (!hits.length) { await send(chatId, `No active tasks tagged #${tag}.`); break; }
        await send(chatId, `🏷️ *#${tag}* (${hits.length})\n\n${hits.map(fmtTask).join('\n')}`);
        break;
      }

      case '/sub': {
        const sp = args.indexOf(' ');
        if (sp === -1) { await send(chatId, 'Usage: `/sub <#id> <text>`'); break; }
        const id = cleanId(args.slice(0, sp));
        const subText = args.slice(sp + 1).trim();
        const parent = (await getTasks()).find((t) => t.id === id);
        if (!parent) { await send(chatId, '❌ Task not found.'); break; }
        const sub = await addSubtask(id, subText);
        await send(chatId, `➕ *${parent.title}*\n  #${sub.order} ${sub.text}`);
        break;
      }

      case '/subs': {
        if (!args) { await send(chatId, 'Usage: `/subs <#id>`'); break; }
        const id = cleanId(args);
        const parent = (await getTasks()).find((t) => t.id === id);
        if (!parent) { await send(chatId, '❌ Task not found.'); break; }
        const subs = await getSubtasks(id);
        if (!subs.length) { await send(chatId, `No subtasks on *#${id} ${parent.title}*.`); break; }
        const lines = subs.map((s) => `${s.done ? '✅' : '⬜'} ${s.order}. ${s.text}`);
        await send(chatId, `*#${id} ${parent.title}*\n\n${lines.join('\n')}`);
        break;
      }

      case '/subdone': {
        const [idRaw, nRaw] = args.split(' ');
        const n = Number(nRaw);
        if (!idRaw || !n) { await send(chatId, 'Usage: `/subdone <#id> <n>`'); break; }
        const ok = await setSubtaskDone(cleanId(idRaw), n, true);
        await send(chatId, ok ? `✅ Subtask ${n} done.` : '❌ Subtask not found.');
        break;
      }

      case '/subdel': {
        const [idRaw, nRaw] = args.split(' ');
        const n = Number(nRaw);
        if (!idRaw || !n) { await send(chatId, 'Usage: `/subdel <#id> <n>`'); break; }
        const ok = await deleteSubtask(cleanId(idRaw), n);
        await send(chatId, ok ? `🗑️ Subtask ${n} deleted.` : '❌ Subtask not found.');
        break;
      }

      case '/stats': {
        const tasks = await getTasks();
        const logs = await getLogs();
        const now = new Date();
        const todayKey = now.toISOString().slice(0, 10);
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

        const active = tasks.filter((t) => t.status !== 'done');
        const done = tasks.filter((t) => t.status === 'done');
        const overdue = active.filter((t) => t.deadline && t.deadline < now.toISOString() && !t.deadline.startsWith(todayKey));
        const completions = logs.filter((l) => l.action === 'task_completed' || l.action === 'task_completed_recurring');
        const thisWeek = completions.filter((l) => l.timestamp >= weekAgo).length;
        const thisMonth = completions.filter((l) => l.timestamp >= monthAgo).length;

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
        const rate = total ? Math.round((done.length / total) * 100) : 0;

        await send(
          chatId,
          `📊 *Stats*\n\n` +
            `Total tasks: ${total}\n` +
            `Active: ${active.length} · Done: ${done.length}\n` +
            `Overdue: ${overdue.length}\n` +
            `Completion rate: ${rate}%\n\n` +
            `Completed this week: ${thisWeek}\n` +
            `Completed this month: ${thisMonth}\n` +
            `Current streak: ${streak} day${streak === 1 ? '' : 's'} ${streak >= 3 ? '🔥' : ''}`
        );
        break;
      }

      case '/clear': {
        const n = args ? Math.min(Math.max(Number(args), 1), 100) : 20;
        if (isNaN(n)) { await send(chatId, 'Usage: `/clear [count]` (1–100, default 20)'); break; }
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
        await send(chatId, `🧹 Cleared ${deleted} message${deleted === 1 ? '' : 's'}.`);
        break;
      }

      case '/help':
      default: {
        await send(
          chatId,
          [
            '*Evelyn commands*',
            '',
            '`/add <title> ; <deadline> ; [recurrence]`',
            '  · `!high` `!low`, `#tag`',
            '`/list` — active tasks',
            '`/today` — overdue + today + upcoming',
            '`/tag <tag>` · `/tags`',
            '`/search <query>`',
            '`/progress <#id> <note>`',
            '`/priority <#id> high|med|low`',
            '`/snooze <#id> <1h|2d|1w>`',
            '`/edit <#id> <field> <value>`',
            '`/sub <#id> <text>` · `/subs <#id>`',
            '`/subdone <#id> <n>` · `/subdel <#id> <n>`',
            '`/done <#id>`',
            '`/delete <#id>`',
            '`/stats`',
            '`/clear [count]`',
          ].join('\n')
        );
      }
    }
  } catch (e: any) {
    await send(chatId, `💥 Error: ${e.message}`);
  }

  return NextResponse.json({ ok: true });
}