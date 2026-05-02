'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Plus,
  Activity,
  ShoppingBag,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookUser,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { getInitials } from '@/lib/utils'
import type { UserProfile } from '@/types/database'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingBag },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/customers', label: 'Customers', icon: BookUser },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
]

const adminNavItems = [
  { href: '/users', label: 'Users', icon: Users },
]

interface AppShellProps {
  user: UserProfile
  children: React.ReactNode
}

export function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const allNavItems = user.role === 'admin' ? [...navItems, ...adminNavItems] : navItems
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-bg-elevated border-r border-border z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-medium text-text-primary">D2D Tracker</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive('/settings')
                ? 'bg-accent-light text-accent'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            Settings
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              Sign out
            </button>
          </form>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{user.full_name}</div>
              <div className="text-xs text-text-tertiary capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay Backdrop ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Slide-in Sidebar ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-bg-elevated border-r border-border z-50 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="font-medium">D2D Tracker</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="icon-btn">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="overflow-y-auto px-3 py-4 space-y-1">
          {allNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
              <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
            </Link>
          ))}
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
            <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
          </Link>
        </nav>
        <div className="px-3 pb-6 border-t border-border pt-4 space-y-1">
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </form>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.full_name}</div>
              <div className="text-xs text-text-tertiary capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-bg-elevated border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="icon-btn"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
              {getInitials(user.full_name)}
            </div>
          </div>
        </header>

        <main id="main" className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-bg-elevated border-t border-border-subtle lg:hidden z-40 shadow-[0_-1px_0_0_rgb(0_0_0/0.06)]">
        <div className="grid grid-cols-5 h-full px-1">
          <BottomTab href="/" label="Home" icon={LayoutDashboard} isActive={pathname === '/'} />
          <BottomTab href="/sales" label="Sales" icon={ShoppingBag} isActive={isActive('/sales')} />
          {/* Centre + Add Sale button */}
          <div className="flex items-center justify-center">
            <Link
              href="/sales/new"
              className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center -mt-4 shadow-md hover:bg-accent-hover transition-colors"
              aria-label="Add sale"
            >
              <Plus className="w-6 h-6" />
            </Link>
          </div>
          <BottomTab href="/activity" label="Activity" icon={Activity} isActive={isActive('/activity')} />
          <BottomTab href="/reports" label="Reports" icon={BarChart2} isActive={isActive('/reports')} />
        </div>
      </nav>
    </div>
  )
}

function BottomTab({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
        isActive ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
