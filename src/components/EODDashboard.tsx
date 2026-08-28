import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Users, 
  Filter, 
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SharedList, Task, EODReport, ListMember, UserRole } from '../types';
import { deleteEODReport, normalizeRole } from '../lib/firebase';
import { RoleBadge } from './RoleBadge';

interface EODDashboardProps {
  list: SharedList;
  currentUser: User;
  tasks: Task[];
  eodReports: EODReport[];
  onOpenSubmitModal: (targetDate?: string, existing?: EODReport | null) => void;
}

export const EODDashboard: React.FC<EODDashboardProps> = ({
  list,
  currentUser,
  tasks,
  eodReports,
  onOpenSubmitModal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const membersList: ListMember[] = Object.values(list.members || {});
  const currentMember = membersList.find((m) => m.uid === currentUser.uid);
  const currentUserRole = normalizeRole(currentMember?.role, list.ownerId === currentUser.uid);
  const isFounder = currentUserRole === 'founder';
  const isManager = currentUserRole === 'manager';

  // Filter reports by selected date
  const dateReports = eodReports.filter((r) => r.date === selectedDate);

  // Filter by role if set
  const filteredReports = dateReports.filter((r) => {
    if (roleFilter === 'all') return true;
    return r.userRole === roleFilter;
  });

  // Calculate submission tracking for selected date
  const submittedUids = new Set(dateReports.map((r) => r.userId));
  const submittedCount = membersList.filter((m) => submittedUids.has(m.uid)).length;
  const totalMembers = membersList.length;
  const completionPercentage = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

  // Find current user's report for the selected date
  const myReportForDate = dateReports.find((r) => r.userId === currentUser.uid);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === todayStr;

  const formatDateDisplay = (dateString: string) => {
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setDeletingId(reportId);
      await deleteEODReport(list.id, reportId);
    } catch (err: unknown) {
      console.error('Failed to delete report:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Generate team markdown summary digest for Slack/Email
  const handleCopyTeamDigest = () => {
    if (dateReports.length === 0) return;

    let digest = `📅 *Team EOD Summary — ${formatDateDisplay(selectedDate)}*\n`;
    digest += `*Workspace:* ${list.title} (${submittedCount}/${totalMembers} submitted)\n\n`;

    dateReports.forEach((rep) => {
      digest += `━━━━━━━━━━━━━━━━━━━━━\n`;
      digest += `👤 *${rep.userName}* (${rep.userRole.toUpperCase()})\n`;
      if (rep.hoursWorked) digest += `⏱️ Hours: ${rep.hoursWorked} hrs\n`;
      digest += `📌 *Summary:* ${rep.summary}\n`;

      if (rep.completedTasks?.length) {
        digest += `✅ *Accomplished:*\n`;
        rep.completedTasks.forEach((t) => (digest += `  • ${t}\n`));
      }

      if (rep.inProgressTasks?.length) {
        digest += `⏳ *In Progress:*\n`;
        rep.inProgressTasks.forEach((t) => (digest += `  • ${t}\n`));
      }

      if (rep.blockers) {
        digest += `⚠️ *Blockers:* ${rep.blockers}\n`;
      }

      if (rep.planForTomorrow) {
        digest += `🔮 *Tomorrow's Plan:* ${rep.planForTomorrow}\n`;
      }
      digest += `\n`;
    });

    navigator.clipboard.writeText(digest);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Controls: Date Switcher & Submission Action */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector & Prev/Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                id="eod-dashboard-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                ({isToday ? 'Today' : formatDateDisplay(selectedDate)})
              </span>
            </div>

            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          {/* Action Buttons: Submit / Edit My EOD + Copy Digest */}
          <div className="flex items-center gap-2">
            {dateReports.length > 0 && (
              <button
                type="button"
                onClick={handleCopyTeamDigest}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
                title="Copy entire team digest in Markdown"
              >
                {copiedDigest ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Team Summary</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Team Digest</span>
                  </>
                )}
              </button>
            )}

            {myReportForDate ? (
              <button
                id="edit-my-eod-btn"
                onClick={() => onOpenSubmitModal(selectedDate, myReportForDate)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit My EOD ({isToday ? 'Today' : selectedDate})</span>
              </button>
            ) : (
              <button
                id="submit-today-eod-btn"
                onClick={() => onOpenSubmitModal(selectedDate, null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Submit {isToday ? 'Today\'s EOD' : `EOD for ${selectedDate}`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Submissions Tracker Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Team Submissions ({submittedCount} / {totalMembers})
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  submittedCount === totalMembers
                    ? 'bg-emerald-100 text-emerald-800'
                    : submittedCount > 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {completionPercentage}% Reported
              </span>
            </div>

            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Filter:</span>
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                  roleFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter('founder')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                  roleFilter === 'founder'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👑 Founder
              </button>
              <button
                onClick={() => setRoleFilter('manager')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                  roleFilter === 'manager'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🛡️ Manager
              </button>
              <button
                onClick={() => setRoleFilter('employee')}
                className={`px-2 py-0.5 rounded-lg font-semibold transition-colors cursor-pointer text-[11px] ${
                  roleFilter === 'employee'
                    ? 'bg-slate-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👤 Employee
              </button>
            </div>
          </div>

          {/* Members submission pill roster */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {membersList.map((m) => {
              const hasSubmitted = submittedUids.has(m.uid);
              const mRole = normalizeRole(m.role, m.uid === list.ownerId);

              return (
                <div
                  key={m.uid}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition-all ${
                    hasSubmitted
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-500 opacity-75'
                  }`}
                  title={`${m.displayName || m.email} (${mRole}): ${
                    hasSubmitted ? 'Submitted EOD' : 'Pending submission'
                  }`}
                >
                  {m.photoURL ? (
                    <img
                      src={m.photoURL}
                      alt={m.displayName}
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                      {(m.displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-[11px] max-w-[100px] truncate">
                    {m.displayName || m.email}
                  </span>
                  {hasSubmitted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              No EOD reports logged for {formatDateDisplay(selectedDate)}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Employees and managers log their daily accomplishments, roadblocks, and next targets here.
            </p>
          </div>
          <button
            onClick={() => onOpenSubmitModal(selectedDate, null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit {isToday ? 'Today\'s EOD' : `Report for ${selectedDate}`}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => {
            const isAuthor = report.userId === currentUser.uid;
            const canDelete = isAuthor || isFounder;
            const hasBlockers = Boolean(report.blockers && report.blockers.trim().length > 0);

            return (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: User avatar + name + role + time + action controls */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {report.userPhotoURL ? (
                        <img
                          src={report.userPhotoURL}
                          alt={report.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {report.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {report.userName}
                          </span>
                          <RoleBadge role={report.userRole} size="sm" />
                          {isAuthor && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{report.userEmail}</span>
                          {report.hoursWorked && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold text-slate-600">
                                {report.hoursWorked} hrs logged
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isAuthor && (
                        <button
                          onClick={() => onOpenSubmitModal(report.date, report)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit report"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary / Headline */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-semibold text-slate-800 leading-snug">
                    📌 {report.summary}
                  </div>

                  {/* Accomplishments section */}
                  {report.completedTasks && report.completedTasks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Accomplishments ({report.completedTasks.length})</span>
                      </div>
                      <ul className="space-y-1 pl-1">
                        {report.completedTasks.map((task, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* In Progress section */}
                  {report.inProgressTasks && report.inProgressTasks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>In Progress ({report.inProgressTasks.length})</span>
                      </div>
                      <ul className="space-y-1 pl-1">
                        {report.inProgressTasks.map((item, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Blockers alert box if any */}
                  {hasBlockers && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Blocker / Impediment</span>
                      </div>
                      <p className="text-amber-800/90 leading-relaxed">{report.blockers}</p>
                    </div>
                  )}

                  {/* Tomorrow's Plan */}
                  {report.planForTomorrow && (
                    <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 text-xs text-indigo-900 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-indigo-800 text-[11px]">
                        <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span>Plan for Tomorrow</span>
                      </div>
                      <p className="text-indigo-900/90 leading-relaxed text-xs">
                        {report.planForTomorrow}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card footer timestamp */}
                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    Reported on {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {report.updatedAt && report.updatedAt !== report.createdAt && (
                    <span className="italic">Edited</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
