export const TZ = 'Asia/Kolkata';

export function fmtIST(iso: string): string {
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

export function fmtShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  });
}

export function isOverdue(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function statusColor(s: string): string {
  if (s === 'done') return '#16a34a';
  if (s === 'in-progress') return '#d97706';
  return '#6b7280';
}

export function priorityColor(p: string): string {
  if (p === 'high') return '#f87171';
  if (p === 'low') return '#737373';
  return '#a3a3a3';
}