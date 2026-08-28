import React from 'react';
import { User } from 'firebase/auth';
import { 
  CheckCircle2, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  Bell, 
  User as UserIcon,
  Sparkles,
  Edit2
} from 'lucide-react';
import { signInWithGoogle, logout } from '../lib/firebase';

interface NavbarProps {
  user: User | null;
  userDisplayName: string;
  loading: boolean;
  onOpenSecurityModal: () => void;
  onOpenProfileModal: () => void;
  dueReminderCount: number;
  onToggleRemindersView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userDisplayName,
  loading,
  onOpenSecurityModal,
  onOpenProfileModal,
  dueReminderCount,
  onToggleRemindersView,
}) => {
  const [signingIn, setSigningIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setAuthError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.message.includes('popup-blocked')) {
        setAuthError('Popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setAuthError('Sign in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error', err);
    }
  };

  const displayName = userDisplayName || user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Real-time Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900">TaskFlow</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Collaborative Workspaces & Assignments</p>
          </div>
        </div>

        {/* Action / User profile */}
        <div className="flex items-center gap-2.5">
          {/* Due Reminder Bell */}
          {user && dueReminderCount > 0 && (
            <button
              id="navbar-reminder-bell-btn"
              onClick={onToggleRemindersView}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title={`${dueReminderCount} due or overdue tasks`}
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {dueReminderCount}
              </span>
            </button>
          )}

          {/* Security badge */}
          <button
            id="security-info-btn"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="View Security & Firestore rules"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">ABAC Security</span>
          </button>

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Avatar and Name Button */}
              <button
                id="user-profile-btn"
                onClick={onOpenProfileModal}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer group"
                title="Click to edit your display name"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-7 h-7 rounded-full border border-slate-200 object-cover shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px] flex items-center gap-1">
                    <span>{displayName}</span>
                    <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    Edit profile
                  </div>
                </div>
              </button>

              <button
                id="sign-out-button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              id="header-sign-in-btn"
              onClick={handleSignIn}
              disabled={signingIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {signingIn ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
      {authError && (
        <div className="bg-rose-50 border-t border-rose-200 px-4 py-2 text-center text-xs font-medium text-rose-700">
          {authError}
        </div>
      )}
    </header>
  );
};
