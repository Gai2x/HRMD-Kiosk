'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { refreshRequests, useDataMode, useRequestSync } from '../../lib/request-store'
import { Icon, type IconName } from '../Icons'
import { AdminSessionProvider, useAdminSession } from './AdminSession'

type NavItem = {
  href: string
  label: string
  description: string
  icon: IconName
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/hrmd-admin',
    label: 'Dashboard',
    description: 'Overview and recent activity',
    icon: 'home',
    exact: true,
  },
  {
    href: '/hrmd-admin/requests',
    label: 'Requests',
    description: 'Search, review, update status',
    icon: 'clipboardCheck',
  },
  {
    href: '/hrmd-admin/employees',
    label: 'Employees',
    description: 'Roster, contacts, request history',
    icon: 'people',
  },
  {
    href: '/hrmd-admin/activity',
    label: 'Activity',
    description: 'Sign-ins, edits, status changes',
    icon: 'clock',
  },
]

function initials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => !part.endsWith('.'))
  if (!parts.length) return 'HR'
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function DatabaseChip({ compact = false }: { compact?: boolean }) {
  const mode = useDataMode()

  if (mode === 'database') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700 ring-1 ring-emerald-200"
        title="Connected to MySQL"
      >
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {!compact && 'MySQL connected'}
      </span>
    )
  }
  if (mode === 'loading') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[0.7rem] font-bold text-muted ring-1 ring-line"
        title="Checking the database"
      >
        <span className="size-1.5 rounded-full bg-slate-400" />
        {!compact && 'Checking database…'}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[0.7rem] font-bold text-amber-700 ring-1 ring-amber-200"
      title="MySQL is not connected — demo data in use"
    >
      <span className="size-1.5 rounded-full bg-amber-500" />
      {!compact && 'Demo mode'}
    </span>
  )
}

function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { staff, signOut } = useAdminSession()

  const displayName = staff?.displayName ?? 'HRMD staff'
  const roleLabel = staff?.role === 'admin' ? 'HRMD Administrator' : 'HRMD Staff'
  const avatar = initials(displayName)

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`flex shrink-0 items-center gap-2.5 ${
          collapsed ? 'justify-center px-2 py-4' : 'px-5 py-4'
        }`}
      >
        <div
          aria-label="HRMD logo"
          className="size-10 shrink-0 overflow-hidden rounded-full border-2 border-line"
        >
          <img alt="" className="size-full object-contain" height={40} src="/hr.jpg" width={40} />
        </div>

        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col leading-none">
            <span className="font-display text-sm font-black tracking-tight text-ink">HRMD</span>
            <span className="mt-0.5 font-display text-[9px] font-bold tracking-[0.18em] text-muted">
              LGU TANJAY CITY
            </span>
          </div>
        )}

      </div>

      <nav aria-label="Admin modules" className={`min-h-0 flex-1 overflow-y-auto pb-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">Modules</p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.href}>
                <Link
                  aria-current={active ? 'page' : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`group flex transition ${
                    collapsed
                      ? `justify-center rounded-xl px-0 py-3 ${active ? 'bg-brand-soft text-brand-dark ring-1 ring-brand/40' : 'text-ink hover:bg-surface'}`
                      : `items-start gap-2.5 rounded-xl px-3 py-2.5 ${active ? 'bg-brand-soft text-brand-dark ring-1 ring-brand/40' : 'text-ink hover:bg-surface'}`
                  }`}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={active ? 'text-brand-dark' : 'text-muted group-hover:text-ink'}
                    name={item.icon}
                    size={18}
                  />
                  {!collapsed && (
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-tight">{item.label}</span>
                      <span className="mt-0.5 block text-[0.7rem] leading-tight text-muted">
                        {item.description}
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={`shrink-0 border-t border-line ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span
              className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark"
              title={`${displayName} · ${roleLabel}`}
            >
              {avatar}
            </span>
            <button
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
              onClick={() => void signOut()}
              title="Sign out"
              type="button"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
                {avatar}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{displayName}</p>
                <p className="truncate text-[0.65rem] text-muted">{roleLabel}</p>
              </div>
              <button
                aria-label="Sign out"
                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
                onClick={() => void signOut()}
                title="Sign out"
                type="button"
              >
                <Icon name="logout" size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DemoModeNotice() {
  const mode = useDataMode()
  const [checking, setChecking] = useState(false)
  if (mode !== 'demo') return null

  const retry = async () => {
    setChecking(true)
    await refreshRequests({ force: true })
    setChecking(false)
  }

  return (
    <div className="mb-5 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Icon className="mt-0.5 shrink-0 text-amber-600" name="warning" size={18} />
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-bold">Demo data in use.</span> MySQL is not connected, so requests and employees
        live in memory and reset on reload. Add a <code className="font-mono text-xs">DATABASE_URL</code> to the
        environment to switch the workspace to the database.
      </p>
      <button
        className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
        disabled={checking}
        onClick={() => void retry()}
        type="button"
      >
        {checking ? 'Checking…' : 'Retry connection'}
      </button>
    </div>
  )
}

function AdminWorkspace({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useRequestSync()

  return (
    <main className="min-h-dvh bg-surface text-ink">
      <div
        className={`lg:grid lg:min-h-dvh ${
          collapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[252px_1fr]'
        } transition-[grid-template-columns] duration-200`}
      >
        <aside className="hidden border-r border-line bg-white lg:block">
          <div className="sticky top-0 h-dvh">
            <SidebarContent collapsed={collapsed} />
          </div>
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setDrawerOpen(false)}
              role="presentation"
            />
            <div
              className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl"
              id="admin-sidebar-drawer"
            >
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-7">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  aria-controls="admin-sidebar-drawer"
                  aria-expanded={drawerOpen}
                  aria-label="Toggle sidebar"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-ink transition hover:bg-surface lg:hidden"
                  onClick={() => setDrawerOpen((open) => !open)}
                  title="Toggle sidebar"
                  type="button"
                >
                  <Icon name={drawerOpen ? 'panelLeftClose' : 'panelLeft'} size={20} />
                </button>
                <button
                  aria-expanded={!collapsed}
                  aria-label="Toggle sidebar"
                  className="hidden size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink lg:grid"
                  onClick={() => setCollapsed((value) => !value)}
                  title="Toggle sidebar"
                  type="button"
                >
                  <Icon name={collapsed ? 'panelLeftOpen' : 'panelLeftClose'} size={18} />
                </button>
                <p className="truncate font-display text-sm font-bold text-ink">HRMD Workspace</p>
              </div>
              <DatabaseChip />
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-7 md:py-6">
            <DemoModeNotice />
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminGate>{children}</AdminGate>
    </AdminSessionProvider>
  )
}

function AdminGate({ children }: { children: ReactNode }) {
  const { status } = useAdminSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'signed-out') router.replace('/hrmd-admin/login')
  }, [status, router])

  if (status !== 'signed-in') {
    return (
      <main className="grid min-h-dvh place-items-center bg-surface">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted">
          <span className="spinner" />
          {status === 'signed-out' ? 'Returning to sign in…' : 'Checking your session…'}
        </div>
      </main>
    )
  }

  return <AdminWorkspace>{children}</AdminWorkspace>
}
