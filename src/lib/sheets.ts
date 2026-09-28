import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { nanoid } from 'nanoid';

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

async function getTasksSheet() {
  const doc = await getDoc();
  return doc.sheetsByTitle['Tasks'];
}
async function getLogsSheet() {
  const doc = await getDoc();
  return doc.sheetsByTitle['Logs'];
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
  };
}

export async function getTasks(): Promise<Task[]> {
  const sheet = await getTasksSheet();
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
}): Promise<Task> {
  const sheet = await getTasksSheet();
  const task: Task = {
    id: nanoid(6).toLowerCase(),
    title: input.title,
    description: input.description ?? '',
    deadline: input.deadline ?? '',
    priority: input.priority ?? 'med',
    status: 'todo',
    progress: '',
    created_at: new Date().toISOString(),
    completed_at: '',
  };
  await sheet.addRow(task);
  await appendLog('task_created', task.id, `${task.title} | ${task.deadline}`);
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task | null> {
  const sheet = await getTasksSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) return null;
  for (const [k, v] of Object.entries(patch)) row.set(k, v);
  await row.save();
  const t = rowToTask(row);
  await appendLog('task_updated', id, JSON.stringify(patch));
  return t;
}

export async function completeTask(id: string): Promise<Task | null> {
  return updateTask(id, {
    status: 'done',
    completed_at: new Date().toISOString(),
  });
}

export async function deleteTask(id: string): Promise<boolean> {
  const sheet = await getTasksSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) return false;
  await row.delete();
  await appendLog('task_deleted', id, '');
  return true;
}

export async function appendLog(action: string, task_id: string, details: string) {
  const sheet = await getLogsSheet();
  await sheet.addRow({
    timestamp: new Date().toISOString(),
    action,
    task_id,
    details,
  });
}

export async function getChatId(): Promise<string | null> {
  return process.env.TELEGRAM_CHAT_ID ?? null;
}