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
  tags: string;
};

export type Subtask = {
  task_id: string;
  order: number;
  text: string;
  done: boolean;
};

export type Stats = {
  total: number;
  active: number;
  done: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completedThisWeek: number;
  completedThisMonth: number;
  completionRate: number;
  streak: number;
};