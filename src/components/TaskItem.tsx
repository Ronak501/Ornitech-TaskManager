import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  UserCheck,
  AlertTriangle,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { Task, Priority, ListMember, TaskAssignee } from '../types';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  members: ListMember[];
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
  members,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category || '');
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const [editAssignedUid, setEditAssignedUid] = useState<string>(
    task.assignedTo ? task.assignedTo.uid : 'unassigned'
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !task.completed;
    if (nextState) {
      // Fire confetti from click origin
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { x, y },
          colors: ['#2563EB', '#10B981', '#F59E0B', '#6366F1'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe ignore
      }
    }
    onToggleComplete(task.id, nextState);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || saving) return;
    try {
      setSaving(true);

      let newAssignee: TaskAssignee | null = null;
      if (editAssignedUid !== 'unassigned') {
        const found = members.find((m) => m.uid === editAssignedUid);
        if (found) {
          newAssignee = {
            uid: found.uid,
            displayName: found.displayName || found.email,
            email: found.email,
            photoURL: found.photoURL,
          };
        }
      }

      await onUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : undefined,
        priority: editPriority,
        category: editCategory.trim() ? editCategory.trim() : undefined,
        dueDate: editDueDate || undefined,
        assignedTo: newAssignee,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setSaving(false);
    }
  };

  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate + 'T00:00:00');
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (task.completed) {
      return { text: `Due: ${task.dueDate}`, status: 'normal' as const };
    }
    if (diffDays < 0) {
      return { 
        text: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`, 
        status: 'overdue' as const 
      };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', status: 'today' as const };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', status: 'upcoming' as const };
    }
    return { text: `Due: ${task.dueDate}`, status: 'normal' as const };
  };

  const dueInfo = getDueDateStatus();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className={`group relative border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
        task.completed
          ? 'border-slate-200/70 bg-slate-50/80 opacity-85'
          : 'border-slate-200/90 hover:border-slate-300 bg-white hover:shadow-sm'
      }`}
    >
      {!isEditing ? (
        <div className="flex items-start gap-3.5">
          {/* Checkbox Toggle */}
          <button
            id={`toggle-task-${task.id}`}
            onClick={handleToggle}
            type="button"
            className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              task.completed
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50'
            }`}
            title={task.completed ? 'Mark as pending' : 'Mark as completed'}
          >
            {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          {/* Task Content Area */}
          <div className="flex-1 min-w-0">
            {/* Metadata Pills Row: Priority, Due Date, Category, Assigned User */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Priority badge */}
              {task.priority === 'high' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  High
                </span>
              )}
              {task.priority === 'medium' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Medium
                </span>
              )}
              {task.priority === 'low' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Low
                </span>
              )}

              {/* Assignee Badge with Display Name */}
              {task.assignedTo ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {task.assignedTo.photoURL ? (
                    <img
                      src={task.assignedTo.photoURL}
                      alt={task.assignedTo.displayName}
                      className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                  )}
                  <span>Assigned to {task.assignedTo.displayName || task.assignedTo.email}</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                  <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                  Unassigned
                </span>
              )}

              {/* Due Date Alert Badge */}
              {dueInfo && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                    dueInfo.status === 'overdue'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      : dueInfo.status === 'today'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : dueInfo.status === 'upcoming'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200/80 font-normal'
                  }`}
                >
                  {dueInfo.status === 'overdue' ? (
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5" />
                  )}
                  {dueInfo.text}
                </span>
              )}

              {/* Category badge */}
              {task.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  {task.category}
                </span>
              )}
            </div>

            {/* Task Title */}
            <h4
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-sm sm:text-base font-semibold break-words cursor-pointer select-none transition-colors ${
                task.completed
                  ? 'line-through text-slate-400 font-normal'
                  : 'text-slate-900 hover:text-blue-600'
              }`}
            >
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <div className="mt-1.5">
                <p
                  className={`text-xs text-slate-600 leading-relaxed whitespace-pre-line ${
                    !isExpanded ? 'line-clamp-2' : ''
                  }`}
                >
                  {task.description}
                </p>
                {task.description.length > 90 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-600 mt-0.5 flex items-center gap-0.5 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>Show less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Show more <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Creator / Completer Attribution Line */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] text-slate-400">
              {task.createdBy && (
                <span>
                  Added by <span className="font-medium text-slate-600">{task.createdBy.displayName}</span>
                </span>
              )}
              {task.completed && task.completedBy && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-600 font-medium">
                    Done by {task.completedBy.displayName}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions: Edit, Delete */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              id={`edit-task-btn-${task.id}`}
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setEditDescription(task.description || '');
                setEditPriority(task.priority);
                setEditCategory(task.category || '');
                setEditDueDate(task.dueDate || '');
                setEditAssignedUid(task.assignedTo ? task.assignedTo.uid : 'unassigned');
                setIsEditing(true);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              id={`delete-task-btn-${task.id}`}
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Edit Task & Assignment
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium"
          />

          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Details / specifications (optional)"
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Edit Assignee */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <select
                  value={editAssignedUid}
                  onChange={(e) => setEditAssignedUid(e.target.value)}
                  className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="unassigned">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      Assign to: {m.displayName || m.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Edit Priority */}
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditPriority(p)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                      editPriority === p
                        ? p === 'high'
                          ? 'bg-white text-rose-700 shadow-xs font-semibold'
                          : p === 'medium'
                          ? 'bg-white text-amber-700 shadow-xs font-semibold'
                          : 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Edit Due Date */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                />
                {editDueDate && (
                  <button
                    type="button"
                    onClick={() => setEditDueDate('')}
                    className="text-slate-400 hover:text-slate-600"
                    title="Clear date"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Edit Category */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Category"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id={`save-edit-task-${task.id}`}
                onClick={handleSaveEdit}
                disabled={!editTitle.trim() || saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
