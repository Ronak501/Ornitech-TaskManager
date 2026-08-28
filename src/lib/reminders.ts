import { Task, DueReminder, SharedList } from '../types';

export function calculateReminders(tasks: Task[], activeList: SharedList | null): DueReminder[] {
  if (!tasks || tasks.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders: DueReminder[] = [];

  for (const task of tasks) {
    // Only pending tasks with a due date and not marked dismissed
    if (task.completed || !task.dueDate || task.reminderDismissed) continue;

    const due = new Date(task.dueDate + 'T00:00:00');
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      reminders.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        status: 'overdue',
        daysDiff: Math.abs(diffDays),
        listId: task.listId,
        listTitle: activeList?.title || 'Shared List',
        assignedTo: task.assignedTo,
      });
    } else if (diffDays === 0) {
      reminders.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        status: 'today',
        daysDiff: 0,
        listId: task.listId,
        listTitle: activeList?.title || 'Shared List',
        assignedTo: task.assignedTo,
      });
    } else if (diffDays <= 2) {
      reminders.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        status: 'upcoming',
        daysDiff: diffDays,
        listId: task.listId,
        listTitle: activeList?.title || 'Shared List',
        assignedTo: task.assignedTo,
      });
    }
  }

  // Sort: overdue first, then today, then upcoming
  return reminders.sort((a, b) => {
    const order = { overdue: 0, today: 1, upcoming: 2 };
    return order[a.status] - order[b.status];
  });
}

// Trigger browser console log & in-app reminder logs as required by prompt
export function notifyDueReminders(reminders: DueReminder[]) {
  if (reminders.length === 0) return;

  reminders.forEach((r) => {
    if (r.status === 'overdue') {
      console.warn(
        `[TaskFlow Reminder] OVERDUE TASK: "${r.taskTitle}" was due on ${r.dueDate} (${r.daysDiff} day(s) overdue). Assigned: ${
          r.assignedTo ? r.assignedTo.displayName : 'Unassigned'
        }`
      );
    } else if (r.status === 'today') {
      console.info(
        `[TaskFlow Reminder] TASK DUE TODAY: "${r.taskTitle}" is due today (${r.dueDate}). Assigned: ${
          r.assignedTo ? r.assignedTo.displayName : 'Unassigned'
        }`
      );
    }
  });
}
