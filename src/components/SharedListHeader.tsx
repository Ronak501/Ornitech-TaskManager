import React from 'react';
import { User } from 'firebase/auth';
import { 
  Users, 
  Folder, 
  Plus, 
  ChevronDown, 
  Crown, 
  CheckSquare, 
  FileText, 
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SharedList, ListMember, MainWorkspaceTab, UserRole } from '../types';
import { normalizeRole } from '../lib/firebase';
import { RoleBadge } from './RoleBadge';

interface SharedListHeaderProps {
  lists: SharedList[];
  activeList: SharedList | null;
  onSelectList: (listId: string) => void;
  onOpenCreateList: () => void;
  onOpenManageMembers: () => void;
  onDeleteList: (listId: string) => void;
  currentUser: User | null;
  activeTab: MainWorkspaceTab;
  onSelectTab: (tab: MainWorkspaceTab) => void;
  pendingTasksCount?: number;
  todayEodReportedCount?: number;
  totalMembersCount?: number;
}

export const SharedListHeader: React.FC<SharedListHeaderProps> = ({
  lists,
  activeList,
  onSelectList,
  onOpenCreateList,
  onOpenManageMembers,
  onDeleteList,
  currentUser,
  activeTab,
  onSelectTab,
  pendingTasksCount = 0,
  todayEodReportedCount = 0,
  totalMembersCount = 1,
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeList) return null;

  const members: ListMember[] = Object.values(activeList.members || {});
  const currentMember = currentUser ? members.find((m) => m.uid === currentUser.uid) : null;
  const userRole: UserRole = normalizeRole(currentMember?.role, currentUser ? activeList.ownerId === currentUser.uid : false);
  const isFounder = userRole === 'founder';

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs text-slate-800 space-y-4">
      {/* Top Row: List Switcher + User's Workspace Role + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Workspace / List Selector dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              id="list-switcher-btn"
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 text-left transition-all cursor-pointer shadow-xs group"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">
                  Workspace
                </div>
                <div className="text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                  {activeList.title}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1 transition-transform" />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Workspaces ({lists.length})
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {lists.map((l) => {
                    const isCurrent = l.id === activeList.id;
                    const memCount = l.memberUids?.length || 1;
                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          onSelectList(l.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isCurrent ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold truncate">{l.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {memCount} {memCount === 1 ? 'member' : 'members'} &bull; by {l.ownerName}
                          </div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 px-2 border-t border-slate-100">
                  <button
                    id="dropdown-create-list-btn"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenCreateList();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Current user's workspace role pill */}
          {currentUser && (
            <div className="hidden sm:block" title="Your role in this workspace">
              <RoleBadge role={userRole} size="sm" />
            </div>
          )}
        </div>

        {/* Action Controls: Members Cluster & Invite button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Member avatars cluster */}
          <div
            onClick={onOpenManageMembers}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            title="Click to manage team members & roles"
          >
            <div className="flex -space-x-2 overflow-hidden">
              {members.slice(0, 4).map((m, idx) => (
                <div
                  key={m.uid || idx}
                  className="inline-block w-6 h-6 rounded-full ring-2 ring-white bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0"
                  title={`${m.displayName || m.email} (${m.role || 'employee'})`}
                >
                  {m.photoURL ? (
                    <img
                      src={m.photoURL}
                      alt={m.displayName}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{(m.displayName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))}
              {members.length > 4 && (
                <div className="inline-block w-6 h-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Manage / Invite button */}
          <button
            id="manage-members-btn"
            onClick={onOpenManageMembers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Team & Roles</span>
          </button>

          {/* New List button */}
          <button
            id="create-list-btn"
            onClick={onOpenCreateList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Create new list"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New List</span>
          </button>

          {/* Delete list if Founder/Owner and > 1 lists */}
          {isFounder && lists.length > 1 && (
            <button
              onClick={() => onDeleteList(activeList.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Delete this workspace (Founder only)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description if present */}
      {activeList.description && (
        <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
          {activeList.description}
        </p>
      )}

      {/* Navigation Switcher: Tasks vs Daily EOD Reports */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <button
            id="nav-tab-tasks-btn"
            onClick={() => onSelectTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Workspace Tasks</span>
            {pendingTasksCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'tasks' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-eod-btn"
            onClick={() => onSelectTab('eod')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'eod'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Daily EOD Reports</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                todayEodReportedCount === totalMembersCount && totalMembersCount > 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : activeTab === 'eod'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {todayEodReportedCount}/{totalMembersCount} Today
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
          <span>Your Role:</span>
          <RoleBadge role={userRole} size="sm" />
        </div>
      </div>
    </div>
  );
};
