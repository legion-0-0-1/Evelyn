export type Bucket = 'morning' | 'afternoon' | 'evening' | 'night';

export const TITLES = ['sir', 'LEGION', 'boss'];

const GREETINGS: Record<Bucket, string[]> = {
  morning: [
    'Good morning, {title} ☀️',
    "Morning, {title}. Let's get after it.",
    'Rise and shine, {title}.',
    'Top of the morning, {title} 🌤️',
  ],
  afternoon: [
    'Good afternoon, {title}.',
    "Afternoon, {title}. What's next?",
    "Hope the day's going well, {title}.",
    'Hey {title} — afternoon check-in.',
  ],
  evening: [
    'Good evening, {title} 🌆',
    'Evening, {title}.',
    'Hope you wrapped up well, {title}.',
    'Hey {title}, evening.',
  ],
  night: [
    'Good night, {title} 🌙',
    'Late one, {title}?',
    'Burning the midnight oil, {title}.',
    'Night, {title}.',
  ],
};

export function getBucket(date = new Date()): Bucket {
  // Convert to IST hour
  const istHour = Number(
    date.toLocaleString('en-IN', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    })
  );
  if (istHour >= 5 && istHour < 12) return 'morning';
  if (istHour >= 12 && istHour < 17) return 'afternoon';
  if (istHour >= 17 && istHour < 21) return 'evening';
  return 'night';
}

export function pickGreeting(bucket: Bucket): string {
  const list = GREETINGS[bucket];
  const template = list[Math.floor(Math.random() * list.length)];
  const title = TITLES[Math.floor(Math.random() * TITLES.length)];
  return template.replace('{title}', title);
}

export function istDateKey(date = new Date()): string {
  // YYYY-MM-DD in IST
  return date
    .toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-');
}

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
    timeZone: 'Asia/Kolkata',
  });
}

/** Parse natural language in IST → returns a true UTC Date */
export function parseIST(raw: string): Date | null {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowShifted = new Date(Date.now() + IST_OFFSET_MS);
  // dynamic import avoided; we accept chrono as global
  const chrono = require('chrono-node');
  const parsedShifted = chrono.parseDate(raw, nowShifted, { forwardDate: true });
  if (!parsedShifted) return null;
  return new Date(parsedShifted.getTime() - IST_OFFSET_MS);
}