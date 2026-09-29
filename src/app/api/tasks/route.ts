import { NextRequest, NextResponse } from 'next/server';
import { getTasks, taskTags, getSubtasks } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? 'all'; // all | active | done | overdue
  const priority = url.searchParams.get('priority') ?? '';
  const tag = url.searchParams.get('tag') ?? '';
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  const all = await getTasks();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  let filtered = all;

  if (status === 'active') filtered = filtered.filter((t) => t.status !== 'done');
  else if (status === 'done') filtered = filtered.filter((t) => t.status === 'done');
  else if (status === 'overdue')
    filtered = filtered.filter(
      (t) => t.status !== 'done' && t.deadline && t.deadline < now && !t.deadline.startsWith(today)
    );

  if (priority) filtered = filtered.filter((t) => t.priority === priority);
  if (tag) filtered = filtered.filter((t) => taskTags(t).includes(tag));
  if (q) filtered = filtered.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  if (from) filtered = filtered.filter((t) => (t.deadline || '') >= from);
  if (to) filtered = filtered.filter((t) => (t.deadline || '') <= to + 'T23:59:59.999Z');

  // attach subtask summary
  const withSubs = await Promise.all(
    filtered.map(async (t) => {
      const subs = await getSubtasks(t.id);
      return {
        ...t,
        subtaskTotal: subs.length,
        subtaskDone: subs.filter((s) => s.done).length,
      };
    })
  );

  return NextResponse.json({ tasks: withSubs });
}