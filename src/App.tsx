import React, { useEffect, useState, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AnimatePresence } from 'motion/react';
import {
  ListTodo,
  AlertCircle,
  Inbox,
  Sparkles,
  Users,
  ShieldCheck,
  FileText,
  Plus
} from 'lucide-react';

import {
  auth,
  subscribeToUserLists,
  subscribeToTasks,
  subscribeToEODReports,
  createSharedList,
  addTaskToSharedList,
  toggleTaskCompletion,
  updateTaskInSharedList,
  deleteTaskFromSharedList,
  deleteSharedList,
  syncUserProfile,
  getUserProfile,
} from './lib/firebase';
import {
  Task,
  SharedList,
  TaskFilter,
  SortOption,
  Priority,
  ListMember,
  DueReminder,
  TaskAssignee,
  MainWorkspaceTab,
  EODReport,
} from './types';
import { calculateReminders, notifyDueReminders } from './lib/reminders';

import { Navbar } from './components/Navbar';
import { AuthCard } from './components/AuthCard';
import { SharedListHeader } from './components/SharedListHeader';
import { ReminderBanner } from './components/ReminderBanner';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { TaskStats } from './components/TaskStats';
import { TaskFilters } from './components/TaskFilters';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { CreateListModal } from './components/CreateListModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { UserProfileModal } from './components/UserProfileModal';
import { EODDashboard } from './components/EODDashboard';
import { EODModal } from './components/EODModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // Collaborative Lists state
  const [lists, setLists] = useState<SharedList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(false);

  // Active List's Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active List's EOD Reports state
  const [eodReports, setEodReports] = useState<EODReport[]>([]);
  const [activeTab, setActiveTab] = useState<MainWorkspaceTab>('tasks');

  // Filters and sorting
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');

  // Reminders state
  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [showRemindersBanner, setShowRemindersBanner] = useState(true);
  const lastRemindersCountRef = useRef<number>(0);

  // Modals state
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // EOD Modal state
  const [isEODModalOpen, setIsEODModalOpen] = useState(false);
  const [eodModalDate, setEodModalDate] = useState<string | undefined>(undefined);
  const [eodEditingReport, setEodEditingReport] = useState<EODReport | null>(null);

  // Active list object
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0] || null;
  }, [lists, activeListId]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          const preferredName =
            profile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
          setUserDisplayName(preferredName);

          await syncUserProfile(currentUser, preferredName);
        } catch (err) {
          console.warn('Profile sync warning:', err);
        }
      } else {
        setLists([]);
        setTasks([]);
        setEodReports([]);
        setActiveListId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user's shared lists
  useEffect(() => {
    if (!user) {
      setLists([]);
      setListsLoading(false);
      return;
    }

    setListsLoading(true);
    const unsubscribe = subscribeToUserLists(
      user.uid,
      async (fetchedLists) => {
        setLists(fetchedLists);
        setListsLoading(false);

        // If no lists exist, bootstrap a default collaborative list for the user
        if (fetchedLists.length === 0) {
          try {
            const initialListId = await createSharedList(
              'Engineering & Ops Workspace',
              'Team collaborative workspace with real-time tasks and daily EOD reporting',
              user,
              userDisplayName
            );
            setActiveListId(initialListId);
          } catch (createErr) {
            console.error('Failed to create default initial list', createErr);
          }
        } else if (!activeListId || !fetchedLists.some((l) => l.id === activeListId)) {
          setActiveListId(fetchedLists[0].id);
        }
      },
      (err) => {
        console.error('Lists subscription error:', err);
        setError('Error loading shared workspaces: ' + err.message);
        setListsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userDisplayName]);

  // Subscribe to tasks of the active list
  useEffect(() => {
    if (!activeList?.id) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    const unsubscribe = subscribeToTasks(
      activeList.id,
      (loadedTasks) => {
        setTasks(loadedTasks);
        setTasksLoading(false);
      },
      (err) => {
        console.error('Tasks subscription error:', err);
        setError('Error loading tasks: ' + err.message);
        setTasksLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeList?.id]);

  // Subscribe to EOD reports of the active list
  useEffect(() => {
    if (!activeList?.id) {
      setEodReports([]);
      return;
    }

    const unsubscribe = subscribeToEODReports(
      activeList.id,
      (reports) => {
        setEodReports(reports);
      },
      (err) => {
        console.error('EOD reports subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [activeList?.id]);

  // Calculate & notify due date reminders whenever tasks change
  useEffect(() => {
    const computed = calculateReminders(tasks, activeList);
    setReminders(computed);

    // If there are new overdue or today reminders, notify in console as required
    if (computed.length > 0 && computed.length !== lastRemindersCountRef.current) {
      notifyDueReminders(computed);
      lastRemindersCountRef.current = computed.length;
    }
  }, [tasks, activeList]);

  // Handlers for Task mutations
  const handleAddTask = async (newTaskData: {
    title: string;
    description?: string;
    priority: Priority;
    category?: string;
    dueDate?: string;
    assignedTo?: TaskAssignee | null;
  }) => {
    if (!user || !activeList) return;
    try {
      await addTaskToSharedList(activeList.id, newTaskData, user, userDisplayName);
    } catch (err: unknown) {
      console.error('Failed to add task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    if (!user || !activeList) return;
    try {
      await toggleTaskCompletion(
        activeList.id,
        taskId,
        completed,
        user.uid,
        userDisplayName || user.displayName || user.email || 'User'
      );
    } catch (err: unknown) {
      console.error('Failed to toggle task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !activeList) return;
    try {
      await updateTaskInSharedList(activeList.id, taskId, updates);
    } catch (err: unknown) {
      console.error('Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !activeList || !deleteTaskId) return;
    try {
      setDeleting(true);
      await deleteTaskFromSharedList(activeList.id, deleteTaskId);
      setDeleteTaskId(null);
    } catch (err: unknown) {
      console.error('Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    try {
      await deleteSharedList(listId);
      const remaining = lists.filter((l) => l.id !== listId);
      if (remaining.length > 0) {
        setActiveListId(remaining[0].id);
      }
    } catch (err: unknown) {
      console.error('Failed to delete list:', err);
      setError('Failed to delete workspace.');
    }
  };

  const handleDismissReminder = async (taskId: string) => {
    if (!activeList) return;
    try {
      await updateTaskInSharedList(activeList.id, taskId, { reminderDismissed: true });
    } catch (err) {
      console.warn('Failed to dismiss reminder', err);
    }
  };

  const handleAcknowledgeAllReminders = async () => {
    if (!activeList) return;
    try {
      await Promise.all(
        reminders.map((r) =>
          updateTaskInSharedList(activeList.id, r.taskId, { reminderDismissed: true })
        )
      );
    } catch (err) {
      console.warn('Failed to acknowledge reminders', err);
    }
  };

  // Categories list
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [tasks]);

  // Counts for status tabs
  const counts = useMemo(() => {
    const all = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = all - completed;
    const assignedToMe = tasks.filter(
      (t) => !t.completed && t.assignedTo && user && t.assignedTo.uid === user.uid
    ).length;
    return { all, active, completed, assignedToMe };
  }, [tasks, user]);

  // Calculate today's EOD stats for header badge
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEodReports = useMemo(() => {
    return eodReports.filter((r) => r.date === todayStr);
  }, [eodReports, todayStr]);

  const todayReportedUserIds = useMemo(() => {
    return new Set(todayEodReports.map((r) => r.userId));
  }, [todayEodReports]);

  const membersList: ListMember[] = useMemo(() => {
    return Object.values(activeList?.members || {});
  }, [activeList?.members]);

  const todayEodReportedCount = useMemo(() => {
    return membersList.filter((m) => todayReportedUserIds.has(m.uid)).length;
  }, [membersList, todayReportedUserIds]);

  // Filtered & Sorted Tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (filter === 'active') {
      result = result.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (filter === 'assigned_to_me') {
      result = result.filter((t) => user && t.assignedTo?.uid === user.uid);
    }

    // Assignee filter
    if (assigneeFilter === 'unassigned') {
      result = result.filter((t) => !t.assignedTo);
    } else if (assigneeFilter !== 'all') {
      result = result.filter((t) => t.assignedTo?.uid === assigneeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.assignedTo && t.assignedTo.displayName.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'createdAt_desc') {
        return b.createdAt - a.createdAt;
      }
      if (sortOption === 'dueDate_asc') {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortOption === 'priority_desc') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (diff !== 0) return diff;
        return b.createdAt - a.createdAt;
      }
      if (sortOption === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [tasks, filter, assigneeFilter, priorityFilter, categoryFilter, searchQuery, sortOption, user]);

  const taskToDelete = tasks.find((t) => t.id === deleteTaskId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col selection:bg-blue-500/20">
      {/* Header / Navbar */}
      <Navbar
        user={user}
        userDisplayName={userDisplayName}
        loading={authLoading}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        dueReminderCount={reminders.length}
        onToggleRemindersView={() => setShowRemindersBanner(!showRemindersBanner)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-700 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-0.5 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {authLoading ? (
          /* Loading Skeleton */
          <div className="space-y-4 max-w-xl mx-auto py-16 text-center">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500">Connecting to Firebase...</p>
          </div>
        ) : !user ? (
          /* Unauthenticated Sign-in Screen */
          <AuthCard />
        ) : !activeList ? (
          /* Workspace loading skeleton */
          <div className="space-y-4 max-w-xl mx-auto py-16 text-center">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium text-slate-500">Setting up workspace...</p>
          </div>
        ) : (
          /* Authenticated Collaborative Workspace */
          <div className="space-y-6">
            {/* Shared List Switcher, Roles & Main View Tabs */}
            <SharedListHeader
              lists={lists}
              activeList={activeList}
              onSelectList={(id) => setActiveListId(id)}
              onOpenCreateList={() => setIsCreateListOpen(true)}
              onOpenManageMembers={() => setIsManageMembersOpen(true)}
              onDeleteList={handleDeleteList}
              currentUser={user}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
              pendingTasksCount={counts.active}
              todayEodReportedCount={todayEodReportedCount}
              totalMembersCount={membersList.length}
            />

            {/* In-App Due Date Reminders Banner */}
            {showRemindersBanner && reminders.length > 0 && activeTab === 'tasks' && (
              <ReminderBanner
                reminders={reminders}
                onDismissReminder={handleDismissReminder}
                onAcknowledgeAll={handleAcknowledgeAllReminders}
              />
            )}

            {/* View Switcher Content: Workspace Tasks VS Daily EOD Reports */}
            {activeTab === 'tasks' ? (
              <div className="space-y-6">
                {/* Header summary & Progress stats */}
                <TaskStats tasks={tasks} />

                {/* Task Creation Input with Assignee & Due Date support */}
                <TaskInput
                  onAddTask={handleAddTask}
                  existingCategories={existingCategories}
                  members={membersList}
                />

                {/* Filters, Search & Sort controls */}
                {tasks.length > 0 && (
                  <TaskFilters
                    filter={filter}
                    setFilter={setFilter}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    assigneeFilter={assigneeFilter}
                    setAssigneeFilter={setAssigneeFilter}
                    categories={existingCategories}
                    members={membersList}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                    counts={counts}
                  />
                )}

                {/* Tasks List */}
                <div className="space-y-3 pt-1">
                  {tasksLoading ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
                      <div className="w-7 h-7 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2.5" />
                      <p className="text-xs font-medium text-slate-500">
                        Syncing real-time workspace updates...
                      </p>
                    </div>
                  ) : filteredAndSortedTasks.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {filteredAndSortedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onDeleteTask={(id) => setDeleteTaskId(id)}
                          onUpdateTask={handleUpdateTask}
                          members={membersList}
                        />
                      ))}
                    </AnimatePresence>
                  ) : tasks.length === 0 ? (
                    /* Empty state: No tasks in this list */
                    <div className="text-center py-14 px-4 bg-white border border-dashed border-slate-300 rounded-2xl shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <ListTodo className="w-6 h-6 text-slate-500" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">
                        No tasks in &quot;{activeList?.title || 'this workspace'}&quot;
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                        This shared list is currently empty. Add a task above to collaborate with your team in real time.
                      </p>
                    </div>
                  ) : (
                    /* Filtered state: No matching tasks */
                    <div className="text-center py-12 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                      <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-800 mb-1">
                        No tasks match your current filters
                      </h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Try adjusting your search query, assignee, priority filter, or status tab.
                      </p>
                      <button
                        onClick={() => {
                          setFilter('all');
                          setPriorityFilter('all');
                          setCategoryFilter('all');
                          setAssigneeFilter('all');
                          setSearchQuery('');
                        }}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Daily EOD Reports View */
              <EODDashboard
                list={activeList}
                currentUser={user}
                tasks={tasks}
                eodReports={eodReports}
                onOpenSubmitModal={(targetDate, existing) => {
                  setEodModalDate(targetDate);
                  setEodEditingReport(existing || null);
                  setIsEODModalOpen(true);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs text-slate-500 text-xs py-4 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Workspace (Founder &bull; Manager &bull; Employee) with Daily EOD Reporting</span>
          </div>
          <div className="text-slate-400">TaskFlow &bull; Live Synchronization Active</div>
        </div>
      </footer>

      {/* Modal: Create Shared List */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreateList={async (title, description) => {
          if (!user) return;
          const newListId = await createSharedList(
            title,
            description,
            user,
            userDisplayName
          );
          setActiveListId(newListId);
        }}
      />

      {/* Modal: Manage Members / Invitations & Role Assignment */}
      {activeList && (
        <ManageMembersModal
          isOpen={isManageMembersOpen}
          onClose={() => setIsManageMembersOpen(false)}
          list={activeList}
          currentUserId={user?.uid || ''}
        />
      )}

      {/* Modal: User Profile Management */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        currentDisplayName={userDisplayName}
        onProfileUpdated={(newName) => setUserDisplayName(newName)}
      />

      {/* Modal: Submit or Edit Daily EOD Report */}
      {activeList && user && (
        <EODModal
          isOpen={isEODModalOpen}
          onClose={() => {
            setIsEODModalOpen(false);
            setEodEditingReport(null);
            setEodModalDate(undefined);
          }}
          list={activeList}
          currentUser={user}
          tasks={tasks}
          existingReport={eodEditingReport}
          targetDate={eodModalDate}
        />
      )}

      {/* Modal: Delete Task Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTaskId}
        taskTitle={taskToDelete ? taskToDelete.title : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTaskId(null)}
        deleting={deleting}
      />

      {/* Modal: Security & Rule Architecture */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={user}
      />
    </div>
  );
}
