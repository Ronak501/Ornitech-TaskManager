import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SharedList, Task, UserProfile, ListMember, Priority, TaskAssignee, UserRole, EODReport } from '../types';

export const normalizeRole = (role?: string, isOwner?: boolean): UserRole => {
  if (isOwner || role === 'founder' || role === 'owner') return 'founder';
  if (role === 'manager') return 'manager';
  return 'employee';
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Error Handling according to Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: Client currently offline or initial handshake pending.");
    }
  }
}

// Authentication methods
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: unknown) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await fbSignOut(auth);
  } catch (error: unknown) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// User Profile management
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const syncUserProfile = async (user: User, customDisplayName?: string): Promise<UserProfile> => {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const now = Date.now();

    const displayName = customDisplayName || user.displayName || user.email?.split('@')[0] || 'User';

    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        photoURL: user.photoURL || undefined,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    } else {
      const existing = snap.data() as UserProfile;
      const updatedProfile: UserProfile = {
        ...existing,
        displayName: customDisplayName || existing.displayName || displayName,
        photoURL: user.photoURL || existing.photoURL,
        updatedAt: now,
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      return updatedProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const updateUserDisplayName = async (user: User, newDisplayName: string): Promise<void> => {
  const path = `users/${user.uid}`;
  try {
    if (user) {
      await updateProfile(user, { displayName: newDisplayName });
    }
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      displayName: newDisplayName,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

// Shared Lists & Real-time Synchronization
export const subscribeToUserLists = (
  userId: string,
  onLists: (lists: SharedList[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const path = 'lists';
  try {
    const q = query(collection(db, 'lists'), where('memberUids', 'array-contains', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const lists: SharedList[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const membersArray: ListMember[] = Array.isArray(data.members)
            ? data.members
            : Object.values(data.members || {});

          lists.push({
            id: docSnap.id,
            title: data.title || 'Untitled List',
            description: data.description,
            ownerId: data.ownerId,
            ownerName: data.ownerName || 'User',
            ownerEmail: data.ownerEmail || '',
            memberUids: data.memberUids || [data.ownerId],
            members: membersArray,
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
          });
        });
        // Sort by updatedAt or createdAt desc
        lists.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
        onLists(lists);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const createSharedList = async (
  title: string,
  description?: string,
  user?: User | null,
  customDisplayName?: string
): Promise<string> => {
  const listId = `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `lists/${listId}`;
  try {
    const currentUser = user || auth.currentUser;
    if (!currentUser) throw new Error('Authentication required to create a shared list');

    const displayName =
      customDisplayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';

    const ownerMember: ListMember = {
      uid: currentUser.uid,
      displayName,
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || undefined,
      role: 'owner',
    };

    const newList = {
      title: title.trim(),
      description: description?.trim() || undefined,
      ownerId: currentUser.uid,
      ownerName: displayName,
      ownerEmail: ownerMember.email,
      memberUids: [currentUser.uid],
      members: [ownerMember],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, 'lists', listId), newList);
    return listId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const addMemberToList = async (
  listId: string,
  member: ListMember,
  currentList: SharedList
): Promise<void> => {
  const path = `lists/${listId}`;
  try {
    const updatedMemberUids = Array.from(new Set([...currentList.memberUids, member.uid]));
    
    // Filter out if already present and append new
    const existingFiltered = currentList.members.filter((m) => m.uid !== member.uid);
    const updatedMembers = [...existingFiltered, member];

    await updateDoc(doc(db, 'lists', listId), {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const removeMemberFromList = async (
  listId: string,
  memberUid: string,
  currentList: SharedList
): Promise<void> => {
  const path = `lists/${listId}`;
  try {
    const updatedMemberUids = currentList.memberUids.filter((uid) => uid !== memberUid);
    const updatedMembers = currentList.members.filter((m) => m.uid !== memberUid);

    await updateDoc(doc(db, 'lists', listId), {
      memberUids: updatedMemberUids,
      members: updatedMembers,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteSharedList = async (listId: string): Promise<void> => {
  const path = `lists/${listId}`;
  try {
    await deleteDoc(doc(db, 'lists', listId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

// Real-time Tasks under Shared List
export const subscribeToTasks = (
  listId: string,
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const path = `lists/${listId}/tasks`;
  try {
    const tasksRef = collection(db, 'lists', listId, 'tasks');
    return onSnapshot(
      tasksRef,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          tasks.push({
            id: docSnap.id,
            listId,
            title: data.title || '',
            description: data.description || undefined,
            completed: !!data.completed,
            priority: (data.priority as Priority) || 'medium',
            category: data.category || undefined,
            dueDate: data.dueDate || undefined,
            reminderDismissed: !!data.reminderDismissed,
            assignedTo: data.assignedTo || null,
            createdBy: data.createdBy,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: data.updatedAt,
            completedAt: data.completedAt,
            completedBy: data.completedBy,
          });
        });
        onTasks(tasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const addTaskToSharedList = async (
  listId: string,
  taskData: {
    title: string;
    description?: string;
    priority: Priority;
    category?: string;
    dueDate?: string;
    assignedTo?: TaskAssignee | null;
  },
  user: User,
  customDisplayName?: string
): Promise<string> => {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `lists/${listId}/tasks/${taskId}`;
  try {
    const creatorName =
      customDisplayName || user.displayName || user.email?.split('@')[0] || 'User';

    const newTask: Omit<Task, 'id'> = {
      listId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || undefined,
      completed: false,
      priority: taskData.priority,
      category: taskData.category || undefined,
      dueDate: taskData.dueDate || undefined,
      reminderDismissed: false,
      assignedTo: taskData.assignedTo || null,
      createdBy: {
        uid: user.uid,
        displayName: creatorName,
        email: user.email || '',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null,
      completedBy: null,
    };

    await setDoc(doc(db, 'lists', listId, 'tasks', taskId), newTask);
    
    // Update list timestamp
    try {
      await updateDoc(doc(db, 'lists', listId), { updatedAt: Date.now() });
    } catch {
      // Non-blocking
    }

    return taskId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const addTask = addTaskToSharedList;

export const updateTaskInSharedList = async (
  listId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'listId' | 'createdAt' | 'createdBy'>>
): Promise<void> => {
  const path = `lists/${listId}/tasks/${taskId}`;
  try {
    const cleanUpdates = {
      ...updates,
      updatedAt: Date.now(),
    };
    await updateDoc(doc(db, 'lists', listId, 'tasks', taskId), cleanUpdates);
    
    try {
      await updateDoc(doc(db, 'lists', listId), { updatedAt: Date.now() });
    } catch {
      // Non-blocking
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const updateTask = updateTaskInSharedList;

export const toggleTaskCompletion = async (
  listId: string,
  taskId: string,
  completed: boolean,
  userId: string,
  userDisplayName: string
): Promise<void> => {
  const path = `lists/${listId}/tasks/${taskId}`;
  try {
    const updates: Partial<Task> = {
      completed,
      completedAt: completed ? Date.now() : null,
      completedBy: completed
        ? {
            uid: userId,
            displayName: userDisplayName,
          }
        : null,
      updatedAt: Date.now(),
    };

    await updateDoc(doc(db, 'lists', listId, 'tasks', taskId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteTaskFromSharedList = async (listId: string, taskId: string): Promise<void> => {
  const path = `lists/${listId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'lists', listId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

export const deleteTask = deleteTaskFromSharedList;

export const updateMemberRole = async (
  listId: string,
  memberUid: string,
  newRole: UserRole,
  currentList: SharedList
): Promise<void> => {
  const path = `lists/${listId}`;
  try {
    // Cannot demote original owner/founder unless transferring, but original owner remains founder
    if (memberUid === currentList.ownerId && newRole !== 'founder') {
      throw new Error('The workspace creator must retain the Founder role.');
    }

    const updatedMembers = currentList.members.map((m) => {
      if (m.uid === memberUid) {
        return {
          ...m,
          role: newRole,
        };
      }
      return m;
    });

    await updateDoc(doc(db, 'lists', listId), {
      members: updatedMembers,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

// Real-time EOD (End of Day) Reports Synchronization
export const subscribeToEODReports = (
  listId: string,
  onReports: (reports: EODReport[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const path = `lists/${listId}/eodReports`;
  try {
    const eodRef = collection(db, 'lists', listId, 'eodReports');
    return onSnapshot(
      eodRef,
      (snapshot) => {
        const reports: EODReport[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          reports.push({
            id: docSnap.id,
            listId,
            userId: data.userId || '',
            userName: data.userName || 'Team Member',
            userEmail: data.userEmail || '',
            userPhotoURL: data.userPhotoURL || undefined,
            userRole: normalizeRole(data.userRole),
            date: data.date || new Date().toISOString().split('T')[0],
            summary: data.summary || '',
            completedTasks: Array.isArray(data.completedTasks) ? data.completedTasks : [],
            inProgressTasks: Array.isArray(data.inProgressTasks) ? data.inProgressTasks : [],
            blockers: data.blockers || undefined,
            planForTomorrow: data.planForTomorrow || undefined,
            hoursWorked: typeof data.hoursWorked === 'number' ? data.hoursWorked : undefined,
            createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
          });
        });
        // Sort newest first
        reports.sort((a, b) => b.createdAt - a.createdAt);
        onReports(reports);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const submitEODReport = async (
  listId: string,
  reportData: Omit<EODReport, 'id' | 'createdAt' | 'updatedAt'>,
  existingReportId?: string
): Promise<string> => {
  const reportId =
    existingReportId || `eod_${reportData.userId}_${reportData.date}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `lists/${listId}/eodReports/${reportId}`;

  try {
    const now = Date.now();
    const docRef = doc(db, 'lists', listId, 'eodReports', reportId);
    
    // Check if doc exists
    const existingSnap = await getDoc(docRef);
    const isNew = !existingSnap.exists();

    const payload: Partial<EODReport> = {
      ...reportData,
      listId,
      updatedAt: now,
    };

    if (isNew) {
      payload.createdAt = now;
      await setDoc(docRef, payload);
    } else {
      await updateDoc(docRef, payload);
    }

    return reportId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const deleteEODReport = async (listId: string, reportId: string): Promise<void> => {
  const path = `lists/${listId}/eodReports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'lists', listId, 'eodReports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};
