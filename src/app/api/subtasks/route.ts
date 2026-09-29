import { NextRequest, NextResponse } from 'next/server';
import { getSubtasks, setSubtaskDone, addSubtask, deleteSubtask } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const task_id = url.searchParams.get('task_id');
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  const subtasks = await getSubtasks(task_id);
  return NextResponse.json({ subtasks });
}

export async function POST(req: NextRequest) {
  const { task_id, text } = await req.json();
  if (!task_id || !text) return NextResponse.json({ error: 'task_id and text required' }, { status: 400 });
  const sub = await addSubtask(task_id, text);
  return NextResponse.json({ subtask: sub });
}

export async function PATCH(req: NextRequest) {
  const { task_id, order, done } = await req.json();
  if (!task_id || !order) return NextResponse.json({ error: 'task_id and order required' }, { status: 400 });
  const ok = await setSubtaskDone(task_id, order, !!done);
  return NextResponse.json({ ok });
}

export async function DELETE(req: NextRequest) {
  const { task_id, order } = await req.json();
  if (!task_id || !order) return NextResponse.json({ error: 'task_id and order required' }, { status: 400 });
  const ok = await deleteSubtask(task_id, order);
  return NextResponse.json({ ok });
}   