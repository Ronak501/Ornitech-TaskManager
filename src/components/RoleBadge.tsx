import React from 'react';
import { Crown, Shield, User as UserIcon } from 'lucide-react';
import { UserRole } from '../types';
import { normalizeRole } from '../lib/firebase';

interface RoleBadgeProps {
  role?: string;
  isOwner?: boolean;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  isOwner = false,
  size = 'sm',
  showIcon = true,
}) => {
  const normRole = normalizeRole(role, isOwner);

  const configs: Record<
    UserRole,
    { label: string; icon: React.ReactNode; bg: string; text: string; border: string }
  > = {
    founder: {
      label: 'Founder',
      icon: <Crown className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
    },
    manager: {
      label: 'Manager',
      icon: <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
    },
    employee: {
      label: 'Employee',
      icon: <UserIcon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
  };

  const current = configs[normRole];
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border shrink-0 ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
