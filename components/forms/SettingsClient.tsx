'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { User, Lock, LogOut, Mail, Shield, Loader2, Check } from 'lucide-react'
import { Field } from '@/components/forms/Field'
import { logout } from '@/app/actions/auth'
import { updateProfile, updatePassword } from '@/app/(app)/settings/actions'
import type { UserProfile } from '@/types/database'

interface SettingsClientProps {
  user: UserProfile
}

export function SettingsClient({ user }: SettingsClientProps) {
  // ── Profile form ──
  const [fullName, setFullName] = useState(user.full_name)
  const [nameError, setNameError] = useState('')
  const [isPendingProfile, startProfileTransition] = useTransition()
  const [profileSaved, setProfileSaved] = useState(false)

  function handleSaveProfile() {
    if (!fullName.trim()) {
      setNameError('Name is required')
      return
    }
    if (fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters')
      return
    }
    setNameError('')
    startProfileTransition(async () => {
      const result = await updateProfile(fullName.trim())
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated')
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 2500)
      }
    })
  }

  // ── Password form ──
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isPendingPassword, startPasswordTransition] = useTransition()

  function handleSavePassword() {
    if (!newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordError('')
    startPasswordTransition(async () => {
      const result = await updatePassword(newPassword, confirmPassword)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Password updated successfully')
        setNewPassword('')
        setConfirmPassword('')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your account and preferences</p>
      </div>

      {/* ── Profile Card ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
            <User className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
            <p className="text-xs text-text-tertiary">Update your display name</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center text-lg font-medium">
              {fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{fullName || '—'}</p>
              <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
            </div>
          </div>

          <Field label="Full Name" name="fullName" error={nameError} required>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (nameError) setNameError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveProfile()
              }}
              className="input-base"
              placeholder="Your full name"
              aria-describedby={nameError ? 'fullName-error' : undefined}
            />
          </Field>

          <button
            onClick={handleSaveProfile}
            disabled={isPendingProfile || fullName.trim() === user.full_name}
            className="primary-btn"
          >
            {isPendingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : profileSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>

      {/* ── Account Info (read-only) ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-secondary flex items-center justify-center">
            <Mail className="w-4 h-4 text-text-secondary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Account</h2>
            <p className="text-xs text-text-tertiary">Your account details</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Email address</label>
            <div className="h-11 w-full px-4 rounded-xl border border-border bg-bg-secondary text-text-secondary flex items-center text-sm select-all">
              {user.email}
            </div>
            <p className="text-xs text-text-tertiary">
              Email address cannot be changed here. Contact support if you need to update it.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Role</label>
            <div className="h-11 w-full px-4 rounded-xl border border-border bg-bg-secondary text-text-secondary flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-text-tertiary" />
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Password Change ── */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-secondary flex items-center justify-center">
            <Lock className="w-4 h-4 text-text-secondary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>
            <p className="text-xs text-text-tertiary">Choose a strong password</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="New Password" name="newPassword">
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              className="input-base"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </Field>

          <Field
            label="Confirm New Password"
            name="confirmPassword"
            error={passwordError}
          >
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePassword()
              }}
              className="input-base"
              placeholder="Repeat new password"
              autoComplete="new-password"
              aria-describedby={passwordError ? 'confirmPassword-error' : undefined}
            />
          </Field>

          <button
            onClick={handleSavePassword}
            disabled={isPendingPassword || !newPassword || !confirmPassword}
            className="primary-btn"
          >
            {isPendingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </div>

      {/* ── Danger Zone / Sign Out ── */}
      <div className="card p-5 border-status-danger/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-status-dangerBg flex items-center justify-center">
            <LogOut className="w-4 h-4 text-status-danger" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Sign Out</h2>
            <p className="text-xs text-text-tertiary">Sign out of your account on this device</p>
          </div>
        </div>

        <form action={logout}>
          <button type="submit" className="danger-btn">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
