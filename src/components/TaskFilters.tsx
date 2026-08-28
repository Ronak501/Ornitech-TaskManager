import React from 'react';
import { Search, ArrowUpDown, X, Tag, UserCheck, Filter } from 'lucide-react';
import { TaskFilter, SortOption, Priority, ListMember } from '../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  priorityFilter: Priority | 'all';
  setPriorityFilter: (p: Priority | 'all') => void;
  categoryFilter: string | 'all';
  setCategoryFilter: (c: string | 'all') => void;
  assigneeFilter: string | 'all';
  setAssigneeFilter: (a: string | 'all') => void;
  categories: string[];
  members: ListMember[];
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  counts: { all: number; active: number; completed: number; assignedToMe: number };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  assigneeFilter,
  setAssigneeFilter,
  categories,
  members,
  sortOption,
  setSortOption,
  counts,
}) => {
  return (
    <div className="space-y-3">
      {/* Top row: Search input + Sorting selector */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="task-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, note, or tag..."
            className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-700 shrink-0 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 hidden sm:inline font-medium">Sort:</span>
            <select
              id="task-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="createdAt_desc" className="bg-white text-slate-800">Newest Created</option>
              <option value="dueDate_asc" className="bg-white text-slate-800">Earliest Due Date</option>
              <option value="priority_desc" className="bg-white text-slate-800">Highest Priority</option>
              <option value="title_asc" className="bg-white text-slate-800">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Second row: Status filter tabs & category/priority/assignee filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {/* Status Tabs (All / Active / Completed / Assigned to Me) */}
        <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 text-xs overflow-x-auto max-w-full">
          <button
            id="filter-tab-all"
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All <span className="opacity-60 ml-0.5">({counts.all})</span>
          </button>
          <button
            id="filter-tab-active"
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              filter === 'active'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active <span className="opacity-60 ml-0.5">({counts.active})</span>
          </button>
          <button
            id="filter-tab-completed"
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
              filter === 'completed'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed <span className="opacity-60 ml-0.5">({counts.completed})</span>
          </button>
          <button
            id="filter-tab-assigned-me"
            type="button"
            onClick={() => setFilter('assigned_to_me')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              filter === 'assigned_to_me'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Assigned to Me</span>
            <span className="opacity-80 ml-0.5">({counts.assignedToMe})</span>
          </button>
        </div>

        {/* Priority & Category & Assignee Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assignee filter */}
          {members.length > 1 && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium shadow-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="filter-assignee-select"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>
                    {m.displayName || m.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority filter */}
          <select
            id="filter-priority-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              id="filter-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters button if any filter is active */}
          {(priorityFilter !== 'all' || categoryFilter !== 'all' || assigneeFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setPriorityFilter('all');
                setCategoryFilter('all');
                setAssigneeFilter('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
