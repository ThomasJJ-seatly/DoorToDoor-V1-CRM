'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  UserPlus,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { RoleBadge } from '@/components/shared/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { formatCurrency, formatDate } from '@/lib/format'
import {
  updateUserRole,
  deactivateUser,
  reactivateUser,
  inviteUser,
} from '@/app/(app)/users/actions'
import { EmptyState } from '@/components/shared/EmptyState'
import type { UserProfile } from '@/types/database'

interface UsersClientProps {
  users: UserProfile[]
  userStats: Record<string, { count: number; revenue: number }>
  currentUserId: string
}

export function UsersClient({ users, userStats, currentUserId }: UsersClientProps) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<UserProfile | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<UserProfile | null>(null)

  // ── Invite form state ──
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'rep'>('rep')
  const [inviteErrors, setInviteErrors] = useState<{ name?: string; email?: string }>({})
  const [isPendingInvite, startInviteTransition] = useTransition()

  function validateInvite() {
    const errs: { name?: string; email?: string } = {}
    if (!inviteName.trim()) errs.name = 'Full name is required'
    if (!inviteEmail.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) errs.email = 'Invalid email address'
    setInviteErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleInvite() {
    if (!validateInvite()) return
    startInviteTransition(async () => {
      const result = await inviteUser(inviteEmail.trim(), inviteName.trim(), inviteRole)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Invite sent to ${inviteEmail}`)
        setShowInviteForm(false)
        setInviteName('')
        setInviteEmail('')
        setInviteRole('rep')
        setInviteErrors({})
      }
    })
  }

  function handleCancelInvite() {
    setShowInviteForm(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('rep')
    setInviteErrors({})
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Users</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {users.length} {users.length === 1 ? 'user' : 'users'}
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="primary-btn shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Invite User</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>

      {/* ── Invite Form ── */}
      {showInviteForm && (
        <div className="card p-5 border-accent/30 bg-accent-light/20 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent" />
              Invite New User
            </h2>
            <button
              onClick={handleCancelInvite}
              className="icon-btn w-8 h-8"
              aria-label="Close invite form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Full Name <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={inviteName}
                onChange={(e) => {
                  setInviteName(e.target.value)
                  if (inviteErrors.name) setInviteErrors((p) => ({ ...p, name: undefined }))
                }}
                className="input-base"
                aria-label="Full name"
              />
              {inviteErrors.name && (
                <p className="text-xs text-status-danger">{inviteErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Email <span className="text-status-danger">*</span>
              </label>
              <input
                type="email"
                placeholder="jane@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  if (inviteErrors.email) setInviteErrors((p) => ({ ...p, email: undefined }))
                }}
                className="input-base"
                aria-label="Email address"
              />
              {inviteErrors.email && (
                <p className="text-xs text-status-danger">{inviteErrors.email}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-secondary">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'rep')}
                className="input-base"
                aria-label="Role"
              >
                <option value="rep">Rep</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleInvite}
              disabled={isPendingInvite}
              className="primary-btn"
            >
              {isPendingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
            <button onClick={handleCancelInvite} className="secondary-btn">
              Cancel
            </button>
          </div>
          <p className="text-xs text-text-tertiary">
            They'll receive an email with a link to set their password and join the app.
          </p>
        </div>
      )}

      {/* ── Users List ── */}
      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No users yet"
          description="Invite team members to get started."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Email</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Role</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-text-secondary">Sales</th>
                  <th className="text-right px-4 py-3 font-medium text-text-secondary">Revenue</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Joined</th>
                  <th className="px-4 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    stats={userStats[user.id] ?? { count: 0, revenue: 0 }}
                    isCurrentUser={user.id === currentUserId}
                    onDeactivate={() => setDeactivateTarget(user)}
                    onReactivate={() => setReactivateTarget(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                stats={userStats[user.id] ?? { count: 0, revenue: 0 }}
                isCurrentUser={user.id === currentUserId}
                onDeactivate={() => setDeactivateTarget(user)}
                onReactivate={() => setReactivateTarget(user)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Deactivate Confirm Modal ── */}
      {deactivateTarget && (
        <ConfirmModal
          title={`Deactivate ${deactivateTarget.full_name}?`}
          description="They will lose access to the app immediately. You can reactivate them later."
          confirmLabel="Deactivate"
          variant="danger"
          onConfirm={async () => {
            const result = await deactivateUser(deactivateTarget.id)
            if (result?.error) {
              toast.error(result.error)
            } else {
              toast.success(`${deactivateTarget.full_name} has been deactivated.`)
            }
            setDeactivateTarget(null)
          }}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}

      {/* ── Reactivate Confirm Modal ── */}
      {reactivateTarget && (
        <ConfirmModal
          title={`Reactivate ${reactivateTarget.full_name}?`}
          description="They will regain access to the app with their previous role."
          confirmLabel="Reactivate"
          variant="default"
          onConfirm={async () => {
            const result = await reactivateUser(reactivateTarget.id)
            if (result?.error) {
              toast.error(result.error)
            } else {
              toast.success(`${reactivateTarget.full_name} has been reactivated.`)
            }
            setReactivateTarget(null)
          }}
          onCancel={() => setReactivateTarget(null)}
        />
      )}
    </div>
  )
}

// ── UserRow (Desktop) ──────────────────────────────────────────────────────

interface UserRowProps {
  user: UserProfile
  stats: { count: number; revenue: number }
  isCurrentUser: boolean
  onDeactivate: () => void
  onReactivate: () => void
}

function UserRow({ user, stats, isCurrentUser, onDeactivate, onReactivate }: UserRowProps) {
  const [isPendingRole, startRoleTransition] = useTransition()

  function handleRoleChange(newRole: 'admin' | 'rep') {
    startRoleTransition(async () => {
      const result = await updateUserRole(user.id, newRole)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Role updated to ${newRole}`)
      }
    })
  }

  return (
    <tr className="hover:bg-bg-secondary/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-accent">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {user.full_name}
              {isCurrentUser && (
                <span className="ml-1.5 text-xs text-text-tertiary font-normal">(you)</span>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-text-secondary text-xs">{user.email}</td>
      <td className="px-4 py-3">
        {isCurrentUser ? (
          <RoleBadge role={user.role} />
        ) : (
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'rep')}
            disabled={isPendingRole}
            className="input-base h-8 text-xs px-2 w-auto min-w-[80px]"
            aria-label={`Role for ${user.full_name}`}
          >
            <option value="admin">Admin</option>
            <option value="rep">Rep</option>
          </select>
        )}
      </td>
      <td className="px-4 py-3">
        {user.is_active ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-danger">
            <XCircle className="w-3.5 h-3.5" />
            Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-text-secondary">{stats.count}</td>
      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
        {formatCurrency(stats.revenue)}
      </td>
      <td className="px-4 py-3 text-text-secondary whitespace-nowrap text-xs">
        {formatDate(user.created_at)}
      </td>
      <td className="px-4 py-3 text-right">
        {!isCurrentUser && (
          user.is_active ? (
            <button
              onClick={onDeactivate}
              className="danger-btn h-8 px-3 text-xs"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={onReactivate}
              className="secondary-btn h-8 px-3 text-xs"
            >
              Reactivate
            </button>
          )
        )}
      </td>
    </tr>
  )
}

// ── UserCard (Mobile) ──────────────────────────────────────────────────────

function UserCard({ user, stats, isCurrentUser, onDeactivate, onReactivate }: UserRowProps) {
  const [isPendingRole, startRoleTransition] = useTransition()

  function handleRoleChange(newRole: 'admin' | 'rep') {
    startRoleTransition(async () => {
      const result = await updateUserRole(user.id, newRole)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Role updated to ${newRole}`)
      }
    })
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-accent">
              {user.full_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {user.full_name}
              {isCurrentUser && (
                <span className="ml-1.5 text-xs text-text-tertiary font-normal">(you)</span>
              )}
            </p>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>
        {user.is_active ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-status-danger shrink-0">
            <XCircle className="w-3.5 h-3.5" />
            Inactive
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-border-subtle">
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Sales</p>
          <p className="font-mono text-sm font-semibold text-text-primary">{stats.count}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Revenue</p>
          <p className="font-mono text-sm font-semibold text-text-primary">
            {formatCurrency(stats.revenue)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-0.5">Role</p>
          {isCurrentUser ? (
            <RoleBadge role={user.role} />
          ) : (
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'rep')}
              disabled={isPendingRole}
              className="input-base h-8 text-xs px-2 w-full"
              aria-label={`Role for ${user.full_name}`}
            >
              <option value="admin">Admin</option>
              <option value="rep">Rep</option>
            </select>
          )}
        </div>
      </div>

      {!isCurrentUser && (
        <div className="pt-1 border-t border-border-subtle">
          {user.is_active ? (
            <button
              onClick={onDeactivate}
              className="danger-btn h-9 px-4 text-sm w-full"
            >
              Deactivate user
            </button>
          ) : (
            <button
              onClick={onReactivate}
              className="secondary-btn h-9 px-4 text-sm w-full"
            >
              Reactivate user
            </button>
          )}
        </div>
      )}
    </div>
  )
}
