import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles,
  ArrowRight,
  Send
} from 'lucide-react';
import { SharedList, Task, EODReport, UserRole } from '../types';
import { submitEODReport, normalizeRole } from '../lib/firebase';
import { RoleBadge } from './RoleBadge';

interface EODModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: SharedList;
  currentUser: User;
  tasks: Task[];
  existingReport?: EODReport | null;
  targetDate?: string;
}

export const EODModal: React.FC<EODModalProps> = ({
  isOpen,
  onClose,
  list,
  currentUser,
  tasks,
  existingReport,
  targetDate,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(targetDate || existingReport?.date || todayStr);
  const [summary, setSummary] = useState('');
  const [completedList, setCompletedList] = useState<string[]>(['']);
  const [inProgressList, setInProgressList] = useState<string[]>(['']);
  const [blockers, setBlockers] = useState('');
  const [planForTomorrow, setPlanForTomorrow] = useState('');
  const [hoursWorked, setHoursWorked] = useState<string>('8');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMember = list.members.find((m) => m.uid === currentUser.uid);
  const userRole: UserRole = normalizeRole(currentMember?.role, list.ownerId === currentUser.uid);

  useEffect(() => {
    if (existingReport) {
      setDate(existingReport.date);
      setSummary(existingReport.summary || '');
      setCompletedList(existingReport.completedTasks?.length ? existingReport.completedTasks : ['']);
      setInProgressList(existingReport.inProgressTasks?.length ? existingReport.inProgressTasks : ['']);
      setBlockers(existingReport.blockers || '');
      setPlanForTomorrow(existingReport.planForTomorrow || '');
      setHoursWorked(existingReport.hoursWorked ? String(existingReport.hoursWorked) : '');
    } else {
      setDate(targetDate || todayStr);
      setSummary('');
      setCompletedList(['']);
      setInProgressList(['']);
      setBlockers('');
      setPlanForTomorrow('');
      setHoursWorked('8');
    }
  }, [existingReport, targetDate, isOpen, todayStr]);

  if (!isOpen) return null;

  // Find tasks completed today by current user to allow quick import
  const completedTodayByUser = tasks.filter(
    (t) =>
      t.completed &&
      (t.completedBy?.uid === currentUser.uid ||
        t.assignedTo?.uid === currentUser.uid ||
        t.createdBy?.uid === currentUser.uid)
  );

  const handleImportCompletedTasks = () => {
    if (completedTodayByUser.length === 0) return;
    const taskTitles = completedTodayByUser.map((t) => t.title);
    // Merge without duplicates
    const combined = Array.from(
      new Set([...completedList.filter((c) => c.trim().length > 0), ...taskTitles])
    );
    setCompletedList(combined.length > 0 ? combined : ['']);
  };

  const handleAddCompletedItem = () => {
    setCompletedList([...completedList, '']);
  };

  const handleUpdateCompletedItem = (index: number, val: string) => {
    const updated = [...completedList];
    updated[index] = val;
    setCompletedList(updated);
  };

  const handleRemoveCompletedItem = (index: number) => {
    if (completedList.length === 1) {
      setCompletedList(['']);
      return;
    }
    setCompletedList(completedList.filter((_, i) => i !== index));
  };

  const handleAddInProgressItem = () => {
    setInProgressList([...inProgressList, '']);
  };

  const handleUpdateInProgressItem = (index: number, val: string) => {
    const updated = [...inProgressList];
    updated[index] = val;
    setInProgressList(updated);
  };

  const handleRemoveInProgressItem = (index: number) => {
    if (inProgressList.length === 1) {
      setInProgressList(['']);
      return;
    }
    setInProgressList(inProgressList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCompleted = completedList.map((c) => c.trim()).filter((c) => c.length > 0);
    const cleanInProgress = inProgressList.map((c) => c.trim()).filter((c) => c.length > 0);

    if (!summary.trim() && cleanCompleted.length === 0) {
      setError('Please provide a brief summary or at least one completed task item.');
      return;
    }

    try {
      setSubmitting(true);
      const parsedHours = hoursWorked ? parseFloat(hoursWorked) : undefined;

      await submitEODReport(
        list.id,
        {
          listId: list.id,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentMember?.displayName || currentUser.email?.split('@')[0] || 'Team Member',
          userEmail: currentUser.email || '',
          userPhotoURL: currentUser.photoURL || undefined,
          userRole,
          date,
          summary: summary.trim() || cleanCompleted[0] || 'Daily EOD Progress',
          completedTasks: cleanCompleted,
          inProgressTasks: cleanInProgress,
          blockers: blockers.trim() || undefined,
          planForTomorrow: planForTomorrow.trim() || undefined,
          hoursWorked: !isNaN(parsedHours as number) ? parsedHours : undefined,
        },
        existingReport?.id
      );

      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to submit End of Day report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl text-slate-800 space-y-5 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {existingReport ? 'Edit Daily EOD Report' : 'Submit End of Day (EOD) Report'}
              </h3>
              <RoleBadge role={userRole} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Workspace: <span className="font-semibold text-slate-700">{list.title}</span> &bull; Log daily achievements for your team
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top metadata grid: Date + Logged Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Report Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="eod-report-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Hours Logged (e.g. 8 hrs)
              </label>
              <input
                id="eod-report-hours"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="8"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Key Summary / Headline */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Executive Summary / Daily Headline <span className="text-rose-500">*</span>
            </label>
            <input
              id="eod-summary-input"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Completed billing module migration and prepared PR for code review"
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Accomplished / Completed Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What did you accomplish today?</span>
              </label>

              {completedTodayByUser.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportCompletedTasks}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Import {completedTodayByUser.length} completed task(s)</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {completedList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 shrink-0 w-4 text-right">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateCompletedItem(idx, e.target.value)}
                    placeholder={`Accomplishment #${idx + 1}...`}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCompletedItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddCompletedItem}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another accomplishment</span>
            </button>
          </div>

          {/* In-Progress / Ongoing Work */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>In-Progress / Work in flight (Optional)</span>
            </label>

            <div className="space-y-2">
              {inProgressList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-500 shrink-0 w-4 text-right">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateInProgressItem(idx, e.target.value)}
                    placeholder={`In-progress item #${idx + 1}...`}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInProgressItem(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddInProgressItem}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another in-progress item</span>
            </button>
          </div>

          {/* Blockers & Challenges */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Blockers, Impediments, or Assistance Needed</span>
            </label>
            <textarea
              id="eod-blockers-input"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Waiting on API credentials for QA environment, or leave blank if none"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Plan for Tomorrow */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              <span>Plan / Target for Tomorrow</span>
            </label>
            <textarea
              id="eod-tomorrow-plan-input"
              rows={2}
              value={planForTomorrow}
              onChange={(e) => setPlanForTomorrow(e.target.value)}
              placeholder="e.g. Run end-to-end integration tests and conduct sprint demo"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="submit-eod-report-btn"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{existingReport ? 'Update EOD Report' : 'Submit EOD to Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
