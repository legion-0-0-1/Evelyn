export type ParsedInput = {
  title: string;
  priority: 'low' | 'med' | 'high';
  tags: string[];
};

/** Pull !high/!low/!med and #tags out of a title, return cleaned title + extracted bits. */
export function extractModifiers(raw: string): ParsedInput {
  let title = raw;
  let priority: 'low' | 'med' | 'high' = 'med';
  const tags: string[] = [];

  // priority
  const priorityMatch = title.match(/(?:^|\s)!(high|med|medium|low)(?=\s|$)/i);
  if (priorityMatch) {
    const p = priorityMatch[1].toLowerCase();
    priority = p === 'high' ? 'high' : p === 'low' ? 'low' : 'med';
    title = title.replace(priorityMatch[0], ' ');
  }

  // tags (#word, allow a-z0-9_-)
  const tagRegex = /(?:^|\s)#([a-z0-9_-]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(title)) !== null) {
    tags.push(m[1].toLowerCase());
  }
  title = title.replace(tagRegex, ' ');

  return {
    title: title.replace(/\s+/g, ' ').trim(),
    priority,
    tags: Array.from(new Set(tags)),
  };
}

/** Parse durations like 1h, 2d, 1w, 30m */
export function parseDuration(raw: string): number | null {
  const m = raw.trim().match(/^(\d+)\s*(m|min|mins|h|hr|hrs|d|day|days|w|week|weeks)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('m')) return n * 60 * 1000;
  if (unit.startsWith('h')) return n * 60 * 60 * 1000;
  if (unit.startsWith('d')) return n * 24 * 60 * 60 * 1000;
  if (unit.startsWith('w')) return n * 7 * 24 * 60 * 60 * 1000;
  return null;
}