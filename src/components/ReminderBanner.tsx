import React from 'react';
import { AlertTriangle, Clock, Calendar, Check, X, Bell, UserCheck } from 'lucide-react';
import { DueReminder } from '../types';

interface ReminderBannerProps {
  reminders: DueReminder[];
  onDismissReminder: (taskId: string) => Promise<void>;
  onAcknowledgeAll: () => Promise<void>;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  reminders,
  onDismissReminder,
  onAcknowledgeAll,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (reminders.length === 0) return null;

  const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
  const todayCount = reminders.filter((r) => r.status === 'today').length;

  return (
    <div className="bg-white border border-rose-200/90 rounded-2xl p-4 shadow-xs text-slate-800 space-y-3 animate-in fade-in duration-200">
      {/* Summary Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Task Due Reminders</span>
              {overdueCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                  {overdueCount} Overdue
                </span>
              )}
              {todayCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  {todayCount} Due Today
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {reminders.length === 1
                ? `1 pending task requires your attention on ${reminders[0].listTitle}`
                : `${reminders.length} tasks due soon or overdue`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isExpanded ? 'Collapse' : 'View All'}
          </button>
          <button
            type="button"
            onClick={onAcknowledgeAll}
            className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-xs"
          >
            Dismiss All
          </button>
        </div>
      </div>

      {/* Expanded list of reminders */}
      {isExpanded && (
        <div className="pt-2 border-t border-rose-100 divide-y divide-rose-50/70 max-h-48 overflow-y-auto">
          {reminders.map((r) => (
            <div
              key={r.taskId}
              className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-rose-50/30 px-1 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-0">
                {r.status === 'overdue' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span className="font-semibold text-slate-800 truncate">{r.taskTitle}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-[11px] text-slate-500">
                  {r.status === 'overdue'
                    ? `Overdue (${r.dueDate})`
                    : `Due Today (${r.dueDate})`}
                </span>
                {r.assignedTo && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    <UserCheck className="w-2.5 h-2.5" />
                    {r.assignedTo.displayName}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDismissReminder(r.taskId)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
                title="Dismiss reminder"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
