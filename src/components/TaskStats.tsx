import React from 'react';
import { CheckCircle2, Clock, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { Task } from '../types';

interface TaskStatsProps {
  tasks: Task[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const highPriorityPending = tasks.filter((t) => !t.completed && t.priority === 'high').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Progress Overview</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              {percentage}% Complete
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {completed} of {total} tasks completed
          </p>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500 font-medium">Pending:</span>
            <span className="font-bold text-slate-900">{pending}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500 font-medium">Done:</span>
            <span className="font-bold text-slate-900">{completed}</span>
          </div>

          {highPriorityPending > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 font-semibold shadow-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{highPriorityPending} High</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80">
        <div
          className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
