import { NextRequest, NextResponse } from 'next/server';
import { getTasks, updateTask, deleteTask, completeTask } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const tasks = await getTasks();
  const t = tasks.find((x) => x.id === params.id);
  if (!t) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ task: t });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await updateTask(params.id, body);
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ task: updated });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.action === 'complete') {
    const r = await completeTask(params.id);
    return NextResponse.json(r ?? { error: 'not found' });
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = await deleteTask(params.id);
  return NextResponse.json({ ok });
}