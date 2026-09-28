import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { nanoid } from 'nanoid';
import { fmtIST } from './greetings';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

let _doc: GoogleSpreadsheet | null = null;
async function getDoc() {
  if (_doc) return _doc;
  const doc = new GoogleSpreadsheet(SHEET_ID, getAuth());
  await doc.loadInfo();
  _doc = doc;
  return doc;
}

async function getSheet(name: string) {
  const doc = await getDoc();
  return doc.sheetsByTitle[name];
}

export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'med' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  progress: string;
  created_at: string;
  completed_at: string;
  recurrence: string;
  deadline_display: string;
  created_display: string;
  completed_display: string;
};

function rowToTask(row: GoogleSpreadsheetRow): Task {
  return {
    id: row.get('id'),
    title: row.get('title'),
    description: row.get('description'),
    deadline: row.get('deadline'),
    priority: row.get('priority'),
    status: row.get('status'),
    progress: row.get('progress'),
    created_at: row.get('created_at'),
    completed_at: row.get('completed_at'),
    recurrence: row.get('recurrence') ?? '',
    deadline_display: row.get('deadline_display') ?? '',
    created_display: row.get('created_display') ?? '',
    completed_display: row.get('completed_display') ?? '',
  };
}

export async function getTasks(): Promise<Task[]> {
  const sheet = await getSheet('Tasks');
  const rows = await sheet.getRows();
  return rows.map(rowToTask);
}

export async function getActiveTasks(): Promise<Task[]> {
  const tasks = await getTasks();
  return tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.deadline || 'z').localeCompare(b.deadline || 'z'));
}

export async function addTask(input: {
  title: string;
  description?: string;
  deadline?: string;
  priority?: 'low' | 'med' | 'high';
  recurrence?: string;
}): Promise<Task> {
  const sheet = await getSheet('Tasks');
  const nowIso = new Date().toISOString();
  const task = {
    id: nanoid(6).toLowerCase(),
    title: input.title,
    description: input.description ?? '',
    deadline: input.deadline ?? '',
    priority: input.priority ?? 'med',
    status: 'todo',
    progress: '',
    created_at: nowIso,
    completed_at: '',
    recurrence: input.recurrence ?? '',
    deadline_display: fmtIST(input.deadline ?? ''),
    created_display: fmtIST(nowIso),
    completed_display: '',
  };
  await sheet.addRow(task);
  await appendLog('task_created', task.id, `${task.title} | ${task.deadline} | ${task.recurrence}`);
  return task as Task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const sheet = await getSheet('Tasks');
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) return null;

  const merged: any = { ...patch };
  if (patch.deadline !== undefined) merged.deadline_display = fmtIST(patch.deadline);
  if (patch.completed_at !== undefined) merged.completed_display = fmtIST(patch.completed_at);

  for (const [k, v] of Object.entries(merged)) row.set(k, v);
  await row.save();
  const t = rowToTask(row);
  await appendLog('task_updated', id, JSON.stringify(patch));
  return t;
}

export async function completeTask(id: string): Promise<{ task: Task; recurring: boolean } | null> {
  const sheet = await getSheet('Tasks');
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) return null;
  const task = rowToTask(row);

  if (task.recurrence) {
    const next = nextOccurrence(task.deadline, task.recurrence);
    if (next) {
      row.set('deadline', next.toISOString());
      row.set('deadline_display', fmtIST(next.toISOString()));
      await row.save();
      await appendLog(
        'task_completed_recurring',
        id,
        `completed at ${fmtIST(new Date().toISOString())}; next ${fmtIST(next.toISOString())}`
      );
      return { task: rowToTask(row), recurring: true };
    }
  }

  const nowIso = new Date().toISOString();
  row.set('status', 'done');
  row.set('completed_at', nowIso);
  row.set('completed_display', fmtIST(nowIso));
  await row.save();
  await appendLog('task_completed', id, task.title);
  return { task: rowToTask(row), recurring: false };
}

export async function deleteTask(id: string): Promise<boolean> {
  const sheet = await getSheet('Tasks');
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) return false;
  await row.delete();
  await appendLog('task_deleted', id, '');
  return true;
}

export async function appendLog(action: string, task_id: string, details: string) {
  const sheet = await getSheet('Logs');
  const ts = new Date().toISOString();
  await sheet.addRow({
    timestamp: ts,
    action,
    task_id,
    details,
    timestamp_display: fmtIST(ts),
  });
}

/* ---------- Messages log for /clear ---------- */

export async function logMessage(chat_id: string, message_id: number, direction: 'in' | 'out') {
  const sheet = await getSheet('Messages');
  const ts = new Date().toISOString();
  await sheet.addRow({
    chat_id,
    message_id: String(message_id),
    sent_at: ts,
    direction,
    sent_display: fmtIST(ts),
  });
}

export async function getRecentOutgoingMessageIds(chat_id: string, limit: number): Promise<number[]> {
  const sheet = await getSheet('Messages');
  const rows = await sheet.getRows();
  const outgoing = rows
    .filter((r) => r.get('chat_id') === chat_id && r.get('direction') === 'out')
    .map((r) => ({ id: Number(r.get('message_id')), row: r }));
  return outgoing.slice(-limit).map((o) => o.id);
}

export async function clearMessageLog(chat_id: string) {
  const sheet = await getSheet('Messages');
  const rows = await sheet.getRows();
  for (const r of rows) {
    if (r.get('chat_id') === chat_id) await r.delete();
  }
}

/* ---------- Settings (for greeting-once-per-bucket) ---------- */

export async function getSetting(key: string): Promise<string | null> {
  const sheet = await getSheet('Settings');
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('key') === key);
  return row ? row.get('value') : null;
}

export async function setSetting(key: string, value: string) {
  const sheet = await getSheet('Settings');
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('key') === key);
  if (row) {
    row.set('value', value);
    await row.save();
  } else {
    await sheet.addRow({ key, value });
  }
}

/* ---------- Recurrence engine ---------- */

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function nextOccurrence(currentIso: string, recurrence: string): Date | null {
  const base = currentIso ? new Date(currentIso) : new Date();
  const rec = recurrence.trim().toLowerCase();

  // every N days / every N weeks
  const everyMatch = rec.match(/^every\s+(\d+)\s+(day|days|week|weeks)$/);
  if (everyMatch) {
    const n = Number(everyMatch[1]);
    const unit = everyMatch[2].startsWith('week') ? 7 : 1;
    const d = new Date(base);
    d.setDate(d.getDate() + n * unit);
    return d;
  }

  if (rec === 'daily') {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    return d;
  }

  if (rec === 'weekly') {
    const d = new Date(base);
    d.setDate(d.getDate() + 7);
    return d;
  }

  if (rec === 'monthly') {
    const d = new Date(base);
    d.setMonth(d.getMonth() + 1);
    return d;
  }

  // monthly <ordinal> <weekday>   e.g. "monthly first monday", "monthly last friday"
  const nthMatch = rec.match(/^monthly\s+(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+([a-z]+)$/);
  if (nthMatch) {
    const ordRaw = nthMatch[1];
    const wdRaw = nthMatch[2];
    const weekday = WEEKDAYS.findIndex((w) => w.startsWith(wdRaw.slice(0, 3)));
    if (weekday === -1) return null;
    const ordMap: Record<string, number> = {
      first: 1, '1st': 1,
      second: 2, '2nd': 2,
      third: 3, '3rd': 3,
      fourth: 4, '4th': 4,
      last: -1,
    };
    const ord = ordMap[ordRaw];
    if (ord === undefined) return null;
    return nthWeekdayOfMonth(base, weekday, ord);
  }

  return null;
}

function nthWeekdayOfMonth(base: Date, weekday: number, ord: number): Date {
  // Start from next month relative to base
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + 1; // next month (0-indexed month)
  const target = new Date(Date.UTC(y, m, 1, base.getUTCHours(), base.getUTCMinutes(), 0, 0));

  if (ord === -1) {
    // last <weekday> of month
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));
    const diff = (lastDay.getUTCDay() - weekday + 7) % 7;
    lastDay.setUTCDate(lastDay.getUTCDate() - diff);
    lastDay.setUTCHours(base.getUTCHours(), base.getUTCMinutes(), 0, 0);
    return lastDay;
  }

  const diff = (weekday - target.getUTCDay() + 7) % 7;
  target.setUTCDate(1 + diff + (ord - 1) * 7);
  return target;
}