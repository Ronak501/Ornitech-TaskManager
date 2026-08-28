export type Priority = 'low' | 'medium' | 'high';
export type UserRole = 'founder' | 'manager' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ListMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole | 'owner' | 'member';
}

export interface SharedList {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberUids: string[];
  members: ListMember[];
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TaskAssignee {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category?: string;
  dueDate?: string; // YYYY-MM-DD format
  reminderDismissed?: boolean;
  assignedTo?: TaskAssignee | null;
  createdBy: {
    uid: string;
    displayName: string;
    email: string;
  };
  completedBy?: {
    uid: string;
    displayName: string;
  } | null;
  createdAt: number;
  updatedAt?: number;
  completedAt?: number | null;
}

export interface EODReport {
  id: string;
  listId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  userRole: UserRole;
  date: string; // YYYY-MM-DD
  summary: string;
  completedTasks: string[];
  inProgressTasks: string[];
  blockers?: string;
  planForTomorrow?: string;
  hoursWorked?: number;
  createdAt: number;
  updatedAt?: number;
}

export type MainWorkspaceTab = 'tasks' | 'eod';
export type TaskFilter = 'all' | 'active' | 'completed' | 'assigned_to_me';
export type SortOption = 'createdAt_desc' | 'dueDate_asc' | 'priority_desc' | 'title_asc';

export interface DueReminder {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  status: 'overdue' | 'today' | 'upcoming';
  daysDiff: number;
  listId: string;
  listTitle: string;
  assignedTo?: TaskAssignee | null;
}
