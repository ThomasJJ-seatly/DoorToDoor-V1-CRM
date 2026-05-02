'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  DoorOpen,
  MessageCircle,
  Presentation,
  ShoppingBag,
  Clock,
} from 'lucide-react'
import { formatDate, formatPercent, formatNumber } from '@/lib/format'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { deleteActivity } from '@/app/(app)/activity/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { DailyActivity } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcConvRate(activity: DailyActivity): number | null {
  return activity.conversations > 0 ? activity.sales_count / activity.conversations : null
}

function calcSalesPerHour(activity: DailyActivity): number | null {
  return activity.hours_worked > 0 ? activity.sales_count / activity.hours_worked : null
}

// ─── Today's pinned card ──────────────────────────────────────────────────────

function TodayCard({
  entry,
  onDelete,
}: {
  entry: DailyActivity
  onDelete: (id: string) => void
}) {
  const convRate = calcConvRate(entry)
  const salesPerHour = calcSalesPerHour(entry)

  return (
    <div className="card p-4 border-accent/30 bg-accent-light/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-accent uppercase tracking-wider">Today</p>
          <p className="font-medium text-text-primary mt-0.5">{entry.suburb}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/activity/new?edit=${entry.id}`}
            className="icon-btn"
            aria-label="Edit today's activity"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="icon-btn text-status-danger hover:text-status-danger hover:bg-status-dangerBg"
            aria-label="Delete today's activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-text-tertiary shrink-0" />
          <div>
            <p className="text-xs text-text-tertiary">Doors</p>
            <p className="font-mono font-medium text-text-primary">
              {formatNumber(entry.doors_knocked)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-text-tertiary shrink-0" />
          <div>
            <p className="text-xs text-text-tertiary">Conv.</p>
            <p className="font-mono font-medium text-text-primary">
              {formatNumber(entry.conversations)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-text-tertiary shrink-0" />
          <div>
            <p className="text-xs text-text-tertiary">Pres.</p>
            <p className="font-mono font-medium text-text-primary">
              {formatNumber(entry.presentations)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-text-tertiary shrink-0" />
          <div>
            <p className="text-xs text-text-tertiary">Sales</p>
            <p className="font-mono font-medium text-text-primary">
              {formatNumber(entry.sales_count)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-tertiary shrink-0" />
          <div>
            <p className="text-xs text-text-tertiary">Hours</p>
            <p className="font-mono font-medium text-text-primary">{entry.hours_worked}h</p>
          </div>
        </div>
      </div>

      {/* Derived metrics */}
      {(convRate !== null || salesPerHour !== null) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-accent/20">
          {convRate !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-text-secondary">Conv:</span>
              <span className="font-mono font-medium text-text-primary">
                {formatPercent(convRate, 0)}
              </span>
            </div>
          )}
          {salesPerHour !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-text-secondary">Sales/hr:</span>
              <span className="font-mono font-medium text-text-primary">
                {salesPerHour.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {entry.notes && (
        <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-accent/20 line-clamp-2">
          {entry.notes}
        </p>
      )}
    </div>
  )
}

// ─── Activity row (desktop table) ─────────────────────────────────────────────

function ActivityRow({
  activity,
  repName,
  onDelete,
}: {
  activity: DailyActivity
  repName?: string
  onDelete: (id: string) => void
}) {
  const convRate = calcConvRate(activity)
  const salesPerHour = calcSalesPerHour(activity)

  return (
    <tr className="group border-b border-border hover:bg-bg-secondary/50 transition-colors">
      <td className="py-3 px-4 text-sm text-text-primary whitespace-nowrap">
        {formatDate(activity.date)}
      </td>
      {repName !== undefined && (
        <td className="py-3 px-4 text-sm text-text-secondary">{repName}</td>
      )}
      <td className="py-3 px-4 text-sm text-text-primary font-medium">{activity.suburb}</td>
      <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
        {formatNumber(activity.doors_knocked)}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
        {formatNumber(activity.conversations)}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
        {formatNumber(activity.presentations)}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
        {formatNumber(activity.sales_count)}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-secondary text-right">
        {activity.hours_worked}h
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-secondary text-right">
        {convRate !== null ? formatPercent(convRate, 0) : '—'}
      </td>
      <td className="py-3 px-4 text-sm font-mono text-text-secondary text-right">
        {salesPerHour !== null ? salesPerHour.toFixed(2) : '—'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          <Link
            href={`/activity/new?edit=${activity.id}`}
            className="icon-btn"
            aria-label="Edit activity"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            className="icon-btn text-status-danger hover:text-status-danger hover:bg-status-dangerBg"
            aria-label="Delete activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Activity card (mobile) ───────────────────────────────────────────────────

function ActivityCard({
  activity,
  repName,
  onDelete,
}: {
  activity: DailyActivity
  repName?: string
  onDelete: (id: string) => void
}) {
  const convRate = calcConvRate(activity)
  const salesPerHour = calcSalesPerHour(activity)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-text-tertiary">{formatDate(activity.date)}</p>
          <p className="font-medium text-text-primary mt-0.5">{activity.suburb}</p>
          {repName && <p className="text-xs text-text-secondary mt-0.5">{repName}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/activity/new?edit=${activity.id}`}
            className="icon-btn"
            aria-label="Edit activity"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            className="icon-btn text-text-tertiary hover:text-status-danger hover:bg-status-dangerBg"
            aria-label="Delete activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center">
        <div>
          <p className="text-xs text-text-tertiary">Doors</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {formatNumber(activity.doors_knocked)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Conv.</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {formatNumber(activity.conversations)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Pres.</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {formatNumber(activity.presentations)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Sales</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {formatNumber(activity.sales_count)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary">Hours</p>
          <p className="text-sm font-mono font-medium text-text-primary">
            {activity.hours_worked}h
          </p>
        </div>
      </div>

      {(convRate !== null || salesPerHour !== null) && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          {convRate !== null && (
            <p className="text-xs text-text-secondary">
              Conv: <span className="font-mono text-text-primary">{formatPercent(convRate, 0)}</span>
            </p>
          )}
          {salesPerHour !== null && (
            <p className="text-xs text-text-secondary">
              Sales/hr:{' '}
              <span className="font-mono text-text-primary">{salesPerHour.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}

      {activity.notes && (
        <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border line-clamp-2">
          {activity.notes}
        </p>
      )}

    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ActivityListClientProps {
  activities: DailyActivity[]
  userMap: Record<string, string>
  isAdmin: boolean
  today: string
  todayEntry: DailyActivity | null
}

export function ActivityListClient({
  activities,
  userMap,
  isAdmin,
  today,
  todayEntry,
}: ActivityListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Past entries (everything except today's own entry shown in the pinned card)
  const pastEntries = activities.filter(
    (a) => !(a.date === today && todayEntry && a.id === todayEntry.id),
  )

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteActivity(deleteTarget)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Activity deleted')
        router.refresh()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Activity</h1>
          <p className="text-sm text-text-secondary mt-1">
            {activities.length === 0
              ? 'No entries yet'
              : `${activities.length} entr${activities.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <Link
          href="/activity/new"
          className="primary-btn"
          aria-label={todayEntry ? "Edit today's log" : 'Log today'}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{todayEntry ? "Edit today's log" : 'Log today'}</span>
          <span className="sm:hidden">{todayEntry ? 'Edit' : 'Log'}</span>
        </Link>
      </div>

      {/* ── Today's pinned entry ── */}
      {todayEntry && (
        <div className="mb-6">
          <TodayCard entry={todayEntry} onDelete={handleDelete} />
        </div>
      )}

      {/* ── No today entry prompt ── */}
      {!todayEntry && (
        <div className="card p-4 mb-6 flex items-center justify-between gap-4 border-dashed">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">No log for today yet</p>
              <p className="text-xs text-text-secondary">Tap to record today's field activity</p>
            </div>
          </div>
          <Link href="/activity/new" className="primary-btn shrink-0">
            <Plus className="w-4 h-4" />
            Log today
          </Link>
        </div>
      )}

      {/* ── Empty state (no past entries either) ── */}
      {pastEntries.length === 0 && !todayEntry && (
        <EmptyState
          icon={<Activity className="w-6 h-6" />}
          title="No activity logged yet"
          description="Start logging your daily field activity to track doors knocked, conversations, and conversion rates."
          action={
            <Link href="/activity/new" className="primary-btn">
              <Plus className="w-4 h-4" />
              Log today's activity
            </Link>
          }
        />
      )}

      {/* ── Past entries — mobile cards ── */}
      {pastEntries.length > 0 && (
        <>
          {/* Section header */}
          {todayEntry && (
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
              Previous entries
            </p>
          )}

          {/* Mobile card list */}
          <div className="space-y-3 sm:hidden">
            {pastEntries.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                repName={isAdmin ? userMap[activity.user_id] : undefined}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left" aria-label="Activity log">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary/50">
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                    {isAdmin && (
                      <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Rep
                      </th>
                    )}
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                      Suburb
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Doors
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Conv.
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Pres.
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Sales
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Hours
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Conv %
                    </th>
                    <th className="py-3 px-4 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right">
                      Sales/hr
                    </th>
                    <th className="py-3 px-4 w-20" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pastEntries.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      repName={isAdmin ? userMap[activity.user_id] : undefined}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete this activity log?"
          description="This will permanently remove the activity entry. This action cannot be undone."
          confirmLabel="Delete entry"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
