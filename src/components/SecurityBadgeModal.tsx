import React from 'react';
import { ShieldCheck, Database, UserCheck, X, Code2, Server, Users } from 'lucide-react';
import { User } from 'firebase/auth';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-800 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Firestore Collaboration Security</h3>
            <p className="text-xs text-slate-500">Attribute-Based Access Control (ABAC) for shared workspaces</p>
          </div>
        </div>

        {/* Security Architecture Details */}
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Collaborative List Isolation:
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="font-mono text-[11px] text-blue-700 font-semibold break-all bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              /lists/&#123;listId&#125;/tasks/&#123;taskId&#125;
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Task documents belong to a shared list. Access is strictly gated: only authenticated users who are recorded in the list's <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[10px]">memberUids</code> array can read, listen to real-time snapshots, or mutate tasks.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              Active Firestore Security Rules:
            </div>
            <pre className="font-mono text-[11px] text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
{`match /lists/{listId} {
  allow read, update: if request.auth != null && (
    resource.data.ownerId == request.auth.uid ||
    request.auth.uid in resource.data.memberUids
  );
  
  match /tasks/{taskId} {
    allow read, write: if request.auth != null && (
      request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.memberUids
    );
  }
}`}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="text-slate-500 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Auth Provider
              </div>
              <div className="font-bold text-slate-900">Google OAuth 2.0</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="text-slate-500 mb-1 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Sync Engine
              </div>
              <div className="font-bold text-slate-900">Firestore onSnapshot</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
