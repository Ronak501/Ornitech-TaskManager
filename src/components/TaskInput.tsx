import React, { useState } from 'react';
import { Plus, Calendar, Tag, UserCheck, ChevronDown, Clock, X } from 'lucide-react';
import { Priority, TaskAssignee, ListMember } from '../types';

interface TaskInputProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: Priority;
    category?: string;
    dueDate?: string;
    assignedTo?: TaskAssignee | null;
  }) => Promise<void>;
  existingCategories: string[];
  members: ListMember[];
}

const DEFAULT_CATEGORIES = ['Work', 'Engineering', 'Design', 'Marketing', 'Personal'];

export const TaskInput: React.FC<TaskInputProps> = ({
  onAddTask,
  existingCategories,
  members,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string>('Work');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [assignedUid, setAssignedUid] = useState<string>('unassigned');
  const [submitting, setSubmitting] = useState(false);

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));

  const handleQuickDueDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      setSubmitting(true);
      const finalCategory = isCustomCat && customCategory.trim()
        ? customCategory.trim()
        : category;

      let assigneeObj: TaskAssignee | null = null;
      if (assignedUid !== 'unassigned') {
        const found = members.find((m) => m.uid === assignedUid);
        if (found) {
          assigneeObj = {
            uid: found.uid,
            displayName: found.displayName || found.email,
            email: found.email,
            photoURL: found.photoURL,
          };
        }
      }

      await onAddTask({
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        priority,
        category: finalCategory || undefined,
        dueDate: dueDate || undefined,
        assignedTo: assigneeObj,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setAssignedUid('unassigned');
      setCustomCategory('');
      setIsCustomCat(false);
      setIsExpanded(false);
    } catch (err) {
      console.error('Failed to add task', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all focus-within:border-blue-400 focus-within:ring-3 focus-within:ring-blue-500/10">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Title Input */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            id="new-task-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Add a new task... (press Enter to save)"
            className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          {!isExpanded && title.trim().length > 0 && (
            <button
              id="quick-add-task-btn"
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shrink-0 transition-all cursor-pointer shadow-xs"
            >
              Add
            </button>
          )}
        </div>

        {/* Expanded options: Description, Assignee, Priority, Due Date, Category */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
            {/* Description textarea */}
            <textarea
              id="new-task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task specifications, links, or acceptance criteria (optional)..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition-colors"
            />

            {/* Selectors Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Task Assignee Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <select
                    id="new-task-assignee-select"
                    value={assignedUid}
                    onChange={(e) => setAssignedUid(e.target.value)}
                    className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="unassigned" className="bg-white text-slate-500">
                      Unassigned
                    </option>
                    {members.map((m) => (
                      <option key={m.uid} value={m.uid} className="bg-white text-slate-800">
                        Assign to: {m.displayName || m.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                      priority === 'low'
                        ? 'bg-white text-blue-700 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                      priority === 'medium'
                        ? 'bg-white text-amber-700 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${
                      priority === 'high'
                        ? 'bg-white text-rose-700 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    High
                  </button>
                </div>

                {/* Due Date Picker */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    id="new-task-duedate-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Clear date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Quick Date Presets */}
                <div className="hidden lg:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDueDate(0)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDueDate(1)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDueDate(7)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
                  >
                    +1 Wk
                  </button>
                </div>

                {/* Category Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {!isCustomCat ? (
                    <select
                      id="new-task-category-select"
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCat(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-white text-slate-700">
                          {c}
                        </option>
                      ))}
                      <option value="__custom__" className="bg-white text-blue-600 font-medium">
                        + New Category...
                      </option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Category"
                        className="bg-transparent text-xs text-slate-800 focus:outline-none w-20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCat(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-task-btn"
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Create Task</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
