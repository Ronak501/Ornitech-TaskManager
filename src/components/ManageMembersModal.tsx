import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User as UserIcon,
  Trash2, 
  Copy, 
  Check, 
  Mail, 
  Share2, 
  Info,
  ChevronDown
} from 'lucide-react';
import { SharedList, ListMember, UserRole } from '../types';
import { addMemberToList, removeMemberFromList, updateMemberRole, normalizeRole } from '../lib/firebase';
import { RoleBadge } from './RoleBadge';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: SharedList | null;
  currentUser: User | null;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  list,
  currentUser,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('employee');
  const [adding, setAdding] = useState(false);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !list || !currentUser) return null;

  const membersList: ListMember[] = Object.values(list.members || {});
  const currentMember = membersList.find((m) => m.uid === currentUser.uid);
  const currentUserRole = normalizeRole(currentMember?.role, list.ownerId === currentUser.uid);

  const isFounder = currentUserRole === 'founder';
  const isManager = currentUserRole === 'manager';
  const canManageMembers = isFounder || isManager;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || adding) return;

    try {
      setAdding(true);
      setError(null);
      setSuccessMsg(null);

      const email = inviteEmail.trim().toLowerCase();
      // Check if already a member
      const existing = membersList.find((m) => m.email.toLowerCase() === email);
      if (existing) {
        setError(`${existing.displayName || email} is already a member of this workspace.`);
        return;
      }

      // Generate a consistent pseudo-uid for invited email
      const memberUid = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const newMember: ListMember = {
        uid: memberUid,
        email,
        displayName: inviteName.trim() || email.split('@')[0],
        role: inviteRole,
      };

      await addMemberToList(list.id, newMember, list);
      setSuccessMsg(`Added ${newMember.displayName} as ${inviteRole.toUpperCase()} to "${list.title}"!`);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('employee');
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to add member. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (memberUid: string, newRole: UserRole, memberName: string) => {
    if (!isFounder) {
      setError('Only the workspace Founder can modify team roles.');
      return;
    }

    try {
      setUpdatingUid(memberUid);
      setError(null);
      await updateMemberRole(list.id, memberUid, newRole, list);
      setSuccessMsg(`Updated ${memberName}'s role to ${newRole.toUpperCase()}.`);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to update role.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleRemoveMember = async (memberUid: string, memberName: string) => {
    if (memberUid === list.ownerId) return;
    try {
      setError(null);
      await removeMemberFromList(list.id, memberUid, list);
      setSuccessMsg(`Removed ${memberName} from workspace.`);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to remove member.');
    }
  };

  const handleCopyShareInfo = () => {
    const info = `Join our workspace "${list.title}" on TaskFlow!\nList ID: ${list.id}`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl w-full shadow-2xl text-slate-800 space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Workspace Team & Roles</h3>
            <p className="text-xs text-slate-500">
              {list.title} &bull; {membersList.length} {membersList.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>

        {/* Role Permissions Information Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Role Hierarchy & Permissions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 rounded-lg border border-amber-200/70">
              <div className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" /> Founder
              </div>
              <p className="text-slate-500 leading-tight">Full authority: workspace settings, role assignments, team reports & all tasks.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-200/70">
              <div className="font-bold text-indigo-800 flex items-center gap-1 mb-1">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Manager
              </div>
              <p className="text-slate-500 leading-tight">Delegate tasks, invite employees, review all team EOD daily reports.</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 flex items-center gap-1 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" /> Employee
              </div>
              <p className="text-slate-500 leading-tight">Execute assigned tasks, log daily End of Day (EOD) work & collaborate.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Form */}
        {canManageMembers && (
          <form onSubmit={handleAddMember} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Add Team Member</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="invite-member-email-input"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Name (Optional)
                </label>
                <input
                  id="invite-member-name-input"
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Assign Role
                </label>
                <select
                  id="invite-member-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="employee">Employee 👤</option>
                  {isFounder && <option value="manager">Manager 🛡️</option>}
                </select>
              </div>
            </div>

            <button
              id="add-member-submit-btn"
              type="submit"
              disabled={!inviteEmail.trim() || adding}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
            >
              {adding ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Add to Team</span>
            </button>
          </form>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Workspace Roster ({membersList.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {isFounder ? 'Founders can adjust member roles' : 'Role-based workspace view'}
            </span>
          </div>
          
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
            {membersList.map((m) => {
              const isMemberFounder = m.uid === list.ownerId;
              const isSelf = m.uid === currentUser.uid;
              const currentNormRole = normalizeRole(m.role, isMemberFounder);

              return (
                <div
                  key={m.uid}
                  className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt={m.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {m.displayName ? m.displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <span>{m.displayName || m.email}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{m.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role selector for Founder, or static RoleBadge for others */}
                    {isFounder && !isMemberFounder ? (
                      <div className="relative inline-block">
                        <select
                          value={currentNormRole}
                          disabled={updatingUid === m.uid}
                          onChange={(e) => handleRoleChange(m.uid, e.target.value as UserRole, m.displayName || m.email)}
                          className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 py-1 pl-2.5 pr-7 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                        >
                          <option value="employee">👤 Employee</option>
                          <option value="manager">🛡️ Manager</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                      </div>
                    ) : (
                      <RoleBadge role={currentNormRole} isOwner={isMemberFounder} size="sm" />
                    )}

                    {/* Delete member button if Founder/Manager */}
                    {canManageMembers && !isMemberFounder && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(m.uid, m.displayName || m.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove member from workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Quick Info */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Share2 className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[200px] font-mono text-[11px]">{list.id}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyShareInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Workspace ID</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
