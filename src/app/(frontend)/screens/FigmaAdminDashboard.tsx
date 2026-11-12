'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { getOptionLabelKey, getRequestType } from '../data/requestTypes'
import {
  dayKey,
  formatClock,
  formatDate,
  formatDateTime,
  formatLongDay,
  maskContact,
  maskEmail,
  statusLabelKey,
  statusTone,
} from '../lib/format'
import { updateRequestStatus, useRequests } from '../lib/request-store'
import { ALL_STATUSES, formatEmployeeName, employeeInitials, type HrmdRequest, type RequestStatus, type ServiceCategory } from '../lib/types'
import type { ServiceId } from '../lib/types'
import { createTranslator } from '../data/translations'
import { FigmaNetworkBackground } from '../components/FigmaNetworkBackground'
import '../components/FigmaNetworkBackground.css'

const ADMIN_NAME = 'Ana D. Reyes'
const ADMIN_USERNAME = 'hrmdadmin'
const ADMIN_PASSWORD = 'DemoAdmin123!'

import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronUp, Copy, Mail, Printer, RotateCcw, Search, Send, ShieldCheck, Sparkles, TrendingUp, User, Users as UsersIcon, X, type LucideIcon, type LucideProps } from 'lucide-react'

const lucideIconMap: Record<string, LucideIcon> = {
  arrowLeft: ArrowLeft,
  calendar: { to: (props: any) => <div {...props} />, name: 'calendar' } as any,
  check: Check,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  copy: Copy,
  mail: Mail,
  printer: Printer,
  refresh: RotateCcw,
  search: Search,
  send: Send,
  shield: ShieldCheck,
  sparkles: Sparkles,
  trend: TrendingUp,
  user: User,
  users: UsersIcon,
  x: X,
}

function Icon({ name, size = 24, strokeWidth = 1.8, ...props }: Omit<LucideProps, 'name'> & { name: string }) {
  const Component = lucideIconMap[name]
  if (!Component) return null
  if (typeof Component === 'function' && 'to' in Component) {
    return (Component as any).to(props as any)
  }
  return <Component aria-hidden="true" size={size} strokeWidth={strokeWidth} {...props} />
}

const FILTERS = [
  'All',
  ...ALL_STATUSES,
  'Certificate of Employment',
  'Service Record',
  'Leave requests',
  'Loan requests',
  'Others',
]

function matchesFilter(item: HrmdRequest, filter: string) {
  if (filter === 'All') return true
  if (filter === 'Leave requests') return getRequestType(item.service).category === 'leave'
  if (filter === 'Loan requests') return getRequestType(item.service).category === 'loan'
  if (filter === 'Certificate of Employment') return item.service === 'coe'
  if (filter === 'Service Record') return item.service === 'service_record'
  if (filter === 'Others') return item.service === 'others'
  return item.status === filter
}

function StatusBadge({ status, t }: { status: RequestStatus; t: (key: string) => string }) {
  const tone = statusTone(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone.badge}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {t(statusLabelKey(status))}
    </span>
  )
}

function volumeSeries(requests: HrmdRequest[]) {
  if (requests.length === 0) return []
  const anchor = requests.reduce(
    (max, item) => (item.submittedAt > max ? item.submittedAt : max),
    requests[0].submittedAt,
  )
  const anchorDate = new Date(anchor)
  const counts = new Map<string, number>()
  for (const item of requests) {
    const key = dayKey(item.submittedAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchorDate.getTime() - (6 - index) * 86_400_000)
    return {
      key: dayKey(date),
      label: new Intl.DateTimeFormat('en-PH', {
        weekday: 'narrow',
        timeZone: 'Asia/Manila',
      }).format(date),
      count: counts.get(dayKey(date)) ?? 0,
    }
  })
}

function serviceLabel(service: ServiceId): string {
  if (service === 'coe') return 'Certificate of Employment'
  if (service === 'service_record') return 'Service Record'
  if (service === 'leave_review') return 'Leave Credit Review'
  if (service === 'leave_balance') return 'Available Leave Balance Request'
  if (service === 'loan') return 'Loan Request'
  if (service === 'others') return 'Others'
  return service
}

function getOptionKey(service: ServiceId, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined
  if (service === 'coe' && optionId === 'coe') return 'details.option.coe'
  if (service === 'service_record' && optionId === 'service_record') return 'details.option.service_record'
  if (service === 'leave_review') {
    if (optionId === 'vacation') return 'details.option.vacation'
    if (optionId === 'sick') return 'details.option.sick'
    if (optionId === 'both') return 'details.option.both'
    if (optionId === 'general') return 'details.option.general'
  }
  if (service === 'leave_balance') {
    if (optionId === 'vacation_balance') return 'details.option.vacation_balance'
    if (optionId === 'sick_balance') return 'details.option.sick_balance'
    if (optionId === 'both_balances') return 'details.option.both_balances'
    if (optionId === 'other_balance') return 'details.option.other_balance'
  }
  if (service === 'loan') {
    if (optionId === 'gsis') return 'details.option.gsis'
    if (optionId === 'landbank') return 'details.option.landbank'
    if (optionId === 'other_loan') return 'details.option.other_loan'
  }
  if (service === 'others') {
    if (optionId === 'ob_request') return 'details.option.ob_request'
    if (optionId === 'contracts') return 'details.option.contracts'
    if (optionId === 'dtr_request') return 'details.option.dtr_request'
    if (optionId === 'others_specify') return 'details.option.others_specify'
  }
  return undefined
}

export function FigmaAdminDashboard() {
  const t = useMemo(() => createTranslator('en') as (key: string) => string, [])
  const requests = useRequests()
  const [signedIn, setSignedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [activeRef, setActiveRef] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<RequestStatus>('Pending')
  const [draftNote, setDraftNote] = useState('')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState<Date | null>(null)

  useMemo(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const active = useMemo(
    () => (activeRef ? (requests.find((item) => item.reference === activeRef) ?? null) : null),
    [activeRef, requests],
  )

  const filtered = useMemo(
    () =>
      requests.filter((item) => {
        const haystack = `${item.reference} ${formatEmployeeName(item.employee)} ${item.employee.office} ${serviceLabel(item.service)}`
        return haystack.toLowerCase().includes(search.toLowerCase()) && matchesFilter(item, filter)
      }),
    [requests, search, filter],
  )

  const sorted = useMemo(() => {
    const copy = [...filtered]
    return copy.sort((a, b) => sort === 'newest' ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt))
  }, [filtered, sort])

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === 'Pending').length,
      review: requests.filter((item) => item.status === 'Under Review').length,
      completed: requests.filter((item) => item.status === 'Completed').length,
      unableToProcess: requests.filter((item) => item.status === 'Unable to Process').length,
      today: now ? requests.filter((item) => dayKey(item.submittedAt) === dayKey(now)).length : 0,
    }),
    [requests, now],
  )

  const series = useMemo(() => volumeSeries(requests), [requests])
  const peak = Math.max(1, ...series.map((day) => day.count))

  const mix = useMemo(() => {
    const total = requests.length || 1
    const share = (category: ServiceCategory) =>
      Math.round(
        (requests.filter((item) => getRequestType(item.service).category === category).length / total) *
          100,
      )
    return [
      { label: 'Documents', value: share('document'), color: 'bg-brand' },
      { label: 'Leave requests', value: share('leave'), color: 'bg-sky-500' },
      { label: 'Loan requests', value: share('loan'), color: 'bg-indigo-400' },
    ]
  }, [requests])

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password.')
      return
    }
    if (username.trim() !== ADMIN_USERNAME || password.trim() !== ADMIN_PASSWORD) {
      setLoginError('Invalid username or password. Please try again.')
      usernameRef.current?.focus()
      return
    }
    setLoggingIn(true)
    window.setTimeout(() => {
      setSignedIn(true)
      setLoggingIn(false)
      setUsername('')
      setPassword('')
      setLoginError('')
    }, 600)
  }

  const openDetails = (request: HrmdRequest) => {
    setActiveRef(request.reference)
    setDraftStatus(request.status)
    setDraftNote('')
  }

  const saveStatus = () => {
    if (!active) return
    updateRequestStatus(active.reference, draftStatus, { note: draftNote, actor: ADMIN_NAME })
    setNotice(`Status updated to “${draftStatus}”.`)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const activeFilters = filter !== 'All' || search.trim().length > 0
  const anyFiltersActive = activeFilters || sort !== 'newest'

  const metrics = [
    {
      label: 'Total Requests',
      value: String(counts.total),
      icon: 'document',
      style: 'bg-brand-soft text-brand-dark',
      detail: `${counts.today} submitted today`,
    },
    {
      label: 'Pending Requests',
      value: String(counts.pending),
      icon: 'clock',
      style: 'bg-amber-50 text-amber-600',
      detail: counts.pending > 0 ? 'Needs attention' : 'Queue is clear',
    },
    {
      label: 'Under Review',
      value: String(counts.review),
      icon: 'search',
      style: 'bg-sky-50 text-sky-600',
      detail: 'In progress',
    },
    {
      label: 'Completed',
      value: String(counts.completed),
      icon: 'check',
      style: 'bg-emerald-50 text-emerald-600',
      detail: counts.total > 0 ? `${counts.completed} finished` : '—',
    },
  ]

  /* ---------- Login screen ---------- */

  if (!signedIn) {
    return (
      <main className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left decorative panel with the approved Figma animated background. */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-ink text-white lg:flex">
          <FigmaNetworkBackground />
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/12"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-center gap-4 px-8 pt-8">
            <div
              aria-label="Lungsod ng Tanjay city seal"
              className="size-16 overflow-hidden rounded-full shadow-xl ring-1 ring-white/20"
            >
              <img
                alt=""
                className="size-full object-contain"
                src="/Branding/tanjay-seal-cropped.png"
              />
            </div>
            <div className="flex flex-col leading-none text-white">
              <span className="font-display text-xl font-black tracking-tight" style={{ textShadow: '0 1px 0 #0008, 0 2px 4px #0004' }}>
                HRMD
              </span>
              <span className="mt-0.5 font-display text-xs font-bold tracking-[0.2em] text-white/90">
                LGU TANJAY CITY
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Admin
            </span>
          </div>

          <div className="relative z-10 max-w-xl px-8 pb-8">
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white">
              Request monitoring,
              <br />
              made straightforward.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/80">
              Monitor employee requests, update processing statuses, and keep a clear audit trail for every transaction.
            </p>
          </div>

          <p className="relative z-10 border-t border-white/10 px-8 py-4 text-sm text-white/55">
            Authorized HRMD personnel only
          </p>
        </section>

        {/* Right login panel. */}
        <section className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3">
              <div
                aria-label="HRMD logo"
                className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-ink/70"
                style={{ width: '56px', height: '56px' }}
              >
                <img
                  alt=""
                  className="block h-full w-full object-contain object-center"
                  src="/hr.jpg"
                  width={56}
                  height={56}
                />
              </div>
              <div className="flex flex-col leading-none text-ink">
                <span className="font-display text-base font-black tracking-tight" style={{ textShadow: '0 1px 0 #0008' }}>
                  HRMD
                </span>
                <span className="mt-0.5 font-display text-[10px] font-bold tracking-[0.2em] text-ink/80">
                  LGU TANJAY CITY
                </span>
              </div>
            </div>

            <p className="eyebrow mt-8">Secure staff access</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">
              Welcome back
            </h2>
            <p className="mt-2 text-muted">Sign in to the HRMD request monitoring workspace.</p>

            <form className="mt-7 space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">Username</span>
                <input
                  className={`field-input ${loginError ? 'border-danger' : ''}`}
                  onChange={(e) => { setUsername(e.target.value); setLoginError('') }}
                  placeholder="Enter your username"
                  type="text"
                  value={username}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-ink">Password</span>
                <div className="relative">
                  <input
                    className={`field-input pr-24 ${loginError ? 'border-danger' : ''}`}
                    onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-dark"
                    onClick={() => setShowPassword((s) => !s)}
                    type="button"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              {loginError && (
                <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                  <Icon name="warning" size={16} />
                  {loginError}
                </div>
              )}
              <button className="btn btn-primary w-full" disabled={loggingIn} type="submit">
                {loggingIn ? (
                  <>
                    <span className="spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Icon name="shield" size={20} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="notice mt-6">
              <Icon className="mt-0.5 shrink-0" name="sparkles" size={19} />
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  DEMO
                </span>
                Frontend demo mode — credentials are mock values, not real authentication.
              </span>
            </div>

            <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink" href="/">
              <Icon name="arrowLeft" size={17} />
              Return to employee kiosk
            </Link>
          </div>
        </section>
      </main>
    )
  }

  /* ---------- Signed in dashboard ---------- */

  return (
    <main className="min-h-screen bg-surface text-ink">
      {/* Main header. */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-5 px-5 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-label="HRMD logo"
              className="relative size-11 shrink-0 overflow-hidden rounded-full border-2 border-line"
              style={{ width: '44px', height: '44px' }}
            >
              <img
                alt="HRMD logo"
                className="block h-full w-full object-contain object-center"
                src="/hr.jpg"
                width={44}
                height={44}
              />
            </div>
            <div className="flex flex-col leading-none text-ink">
              <span className="font-display text-sm font-black tracking-tight" style={{ textShadow: '0 1px 0 #0004' }}>
                HRMD
              </span>
              <span className="mt-0.5 font-display text-[9px] font-bold tracking-[0.2em] text-ink/70">
                LGU TANJAY CITY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{ADMIN_NAME}</p>
              <p className="text-xs text-muted">HRMD Administrator</p>
            </div>
            <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
              AR
            </span>
            <button
              aria-label="Sign out"
              className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink"
              onClick={() => { setSignedIn(false); setActiveRef(null) }}
              type="button"
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-7 md:px-8">
        {/* Greeting. */}
        <div className="flex flex-col justify-between gap-3 pb-2 md:flex-row md:items-start md:gap-6">
          <div>
            <p className="eyebrow">HRMD monitoring workspace</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Request Overview</h1>
            <p className="mt-1 text-sm text-muted">
              Monitor and manage employee service requests.
            </p>
          </div>
          <p className="text-sm text-muted">
            {now ? formatLongDay(now) : 'Philippine Standard Time'}
          </p>
        </div>

        {/* KPI cards. */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div className="card p-5" key={metric.label}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-muted">{metric.label}</p>
                  <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{metric.value}</p>
                </div>
                <span className={`grid size-11 place-items-center rounded-xl shrink-0 ${metric.style}`}>
                  <Icon name={metric.icon} size={22} />
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">{metric.detail}</p>
            </div>
          ))}
        </div>

        {/* Analytics: volume chart + by-type breakdown. */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
          <section className="card p-5 xl:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">request volume</h2>
                <p className="text-sm text-muted">Last 7 days · requests</p>
              </div>
              <span className="rounded-lg bg-surface px-3 py-2 text-xs font-bold">All request types</span>
            </div>

            {series.length === 0 ? (
              <div className="mt-8 flex h-40 items-center justify-center rounded-xl border border-line bg-surface/50 text-center">
                <div>
                  <p className="font-display text-lg font-bold">No activity yet</p>
                  <p className="mt-1 text-sm text-muted">
                    Requests submitted in the last week will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-1">
                {/* Y axis + bars + labels, each bar a fixed grid column. */}
                <div className="flex h-48">
                  {/* left value spacer */}
                  <div className="pr-3 text-right text-[10px] font-bold text-muted">
                    {peak}
                  </div>
                  {series.map((day) => (
                    <div key={day.key} className="flex flex-1 flex-col justify-end">
                      <div className="flex flex-1 flex-col justify-end">
                        <span className="mb-1.5 flex h-7 w-full items-center justify-end pr-1 text-right text-[10px] font-bold text-muted">
                          {day.count > 0 ? day.count : ''}
                        </span>
                        <div
                          className="h-40 w-full rounded-t-md bg-gradient-to-t from-brand to-emerald-400 transition-all"
                          style={{ height: `${Math.max((day.count / peak) * 100, day.count > 0 ? 12 : 4)}%` }}
                        />
                      </div>
                      <span className="mt-2 shrink-0 text-center text-[11px] font-bold text-ink">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="card p-5 xl:p-6">
            <h2 className="font-display font-bold">request mix</h2>
            <div className="mt-5 space-y-4">
              {mix.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{row.label}</span>
                    <span className="font-bold">{row.value}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                    <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
              {mix.every((row) => row.value === 0) && (
                <div className="text-sm text-muted">
                  No request types yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Request management — primary work area. */}
        <section className="card mt-6 overflow-hidden">
          <div className="border-b border-line p-5 xl:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Request Management</h2>
                <p className="mt-1 text-sm text-muted">Search, filter, and review incoming requests.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="swatch"></span>
                <span className="text-xs font-semibold text-muted">Showing {sorted.length} of {requests.length}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" name="search" size={18} />
                <input
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-line bg-white pl-11 pr-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or reference…"
                  value={search}
                />
              </div>
              <div className="flex gap-3">
                <select
                  className="h-12 min-w-[150px] rounded-xl border border-line bg-white px-4 font-semibold outline-none focus:border-brand"
                  onChange={(e) => setFilter(e.target.value)}
                  value={filter}
                >
                  {FILTERS.map((option) => <option key={option}>{option}</option>)}
                </select>
                {activeFilters && (
                  <button
                    className="shrink-0 rounded-xl border border-brand bg-brand-soft px-4 text-sm font-bold text-brand-dark hover:bg-brand/90"
                    onClick={() => { setFilter('All'); setSearch('') }}
                    type="button"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-muted">
              <span className="flex items-center gap-1.5">
                <span className="grid size-1.5 place-items-center rounded-full bg-brand" />
                {sorted.length > 0
                  ? `${sorted.length} request${sorted.length === 1 ? '' : 's'}`
                  : 'No requests'}
              </span>
              <span className="flex items-center gap-2">
                <span>Sort by</span>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    sort === 'newest'
                      ? 'bg-brand-soft text-brand-dark ring-1 ring-brand'
                      : 'bg-surface text-ink hover:bg-surface/80'
                  }`}
                  onClick={() => setSort('newest')}
                  type="button"
                >
                  Newest
                </button>
                <button
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    sort === 'oldest'
                      ? 'bg-brand-soft text-brand-dark ring-1 ring-brand'
                      : 'bg-surface text-ink hover:bg-surface/80'
                  }`}
                  onClick={() => setSort('oldest')}
                  type="button"
                >
                  Oldest
                </button>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold">Reference</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Employee</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Request Type</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Office</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Submitted</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Status</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sorted.map((row) => {
                    const optionKey = getOptionKey(row.service, row.optionId)
                    const othersLabel =
                      row.service === 'others' && row.optionId === 'others_specify' && row.othersSpecified
                        ? ` — ${row.othersSpecified}`
                        : ''
                    return (
                      <tr
                        className="transition hover:bg-surface/90 hover:border-l-2 hover:border-brand"
                        key={row.reference}
                      >
                        <td className="px-4 py-3.5 font-mono text-sm font-bold text-brand-dark whitespace-nowrap">
                          {row.reference}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{formatEmployeeName(row.employee)}</p>
                            <p className="mt-0.5 text-xs text-muted truncate">{row.employee.position}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div>
                            <p className="font-semibold">{serviceLabel(row.service)}{othersLabel}</p>
                            {optionKey && <p className="mt-0.5 text-xs text-muted">{t(optionKey)}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink ring-1 ring-line">
                            <span className="text-amber-600">·</span>
                            {row.employee.office}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
                          {formatDate(row.submittedAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={row.status} t={t} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-dark hover:bg-surface hover:text-brand-dark"
                            onClick={() => openDetails(row)}
                            type="button"
                          >
                            View
                            <Icon name="chevronDown" size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="flex min-h-[160px] items-center justify-center rounded-b-xl border border-line bg-surface/40 p-8 text-center">
                  <div>
                    <Icon className="mx-auto mb-3 text-muted" name="search" size={32} />
                    <p className="font-display text-lg font-bold">No matching requests</p>
                    <p className="mt-1 text-sm text-muted">
                      Try a different search or clear the {anyFiltersActive ? 'filters' : 'filter'}.
                    </p>
                    {activeFilters && (
                      <button
                        className="mt-4 rounded-lg bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand-dark hover:bg-brand/90"
                        onClick={() => { setFilter('All'); setSearch('') }}
                        type="button"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {notice && (
        <div className="animate-rise fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-ink px-5 py-4 font-bold text-white shadow-2xl">
          <Icon name="check" size={20} />
          {notice}
        </div>
      )}

      {/* View Details drawer. */}
      {active && (
        <div
          className="animate-fade fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveRef(null)}
          role="presentation"
        >
          <div
            aria-label={`Request details ${active.reference}`}
            className="animate-pop w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-line bg-white px-6 py-4">
              <div>
                <p className="eyebrow">Request details</p>
                <h2 className="mt-1 font-mono text-xl font-bold text-ink">{active.reference}</h2>
              </div>
              <button
                aria-label="Close details"
                className="grid size-11 place-items-center rounded-xl text-muted hover:bg-surface"
                onClick={() => setActiveRef(null)}
                type="button"
              >
                <Icon name="x" size={22} />
              </button>
            </div>

            <div className="space-y-5 p-6 md:p-8">
              {/* Status + employee quick facts. */}
              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-2xl border border-line p-5 md:p-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">current status</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <StatusBadge status={active.status} t={t} />
                    <span className="mx-2 text-muted">·</span>
                    <span className="text-sm text-muted">
                      {formatDateTime(active.submittedAt)}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      [t('details.docType'), ''] as [string, string],
                      [t('details.purpose'), ''] as [string, string],
                    ].map(([label]) => (
                      <div key={label}>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
                        <dd className="mt-1 font-semibold">{active.status}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="rounded-2xl border border-line p-5 md:p-6">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">employee</h3>
                  <div className="mt-3 flex items-center gap-2.5">
                    <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
                      {employeeInitials(active.employee)}
                    </span>
                    <div>
                      <p className="font-bold">{formatEmployeeName(active.employee)}</p>
                      <p className="mt-0.5 text-sm text-muted">{active.employee.position}</p>
                      <p className="mt-0.5 text-xs text-muted">{active.employee.email}</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-x-7 gap-y-4 sm:grid-cols-2">
                    {[
                      ['Department / Office', active.employee.office],
                      ['Employment Status', active.employee.employmentStatus],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
                        <dd className="mt-1 font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>

              {/* Request information. */}
              <section className="rounded-2xl border border-line p-5 md:p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">request information</h3>
                <dl className="mt-4 grid gap-x-7 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">Request Type</dt>
                    <dd className="mt-1 font-semibold">
                      {serviceLabel(active.service)}
                      {active.service === 'others' && active.optionId === 'others_specify' && active.othersSpecified && (
                        <span className="block text-sm text-muted">{active.othersSpecified}</span>
                      )}
                      {getOptionKey(active.service, active.optionId) && (
                        <span className="block text-sm text-muted">{t(getOptionKey(active.service, active.optionId)!)}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">Purpose</dt>
                    <dd className="mt-1 font-semibold">{active.purpose}</dd>
                  </div>
                  {active.copies && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-muted">Copies Needed</dt>
                      <dd className="mt-1 font-semibold">{active.copies}</dd>
                    </div>
                  )}
                  {active.remarks && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-muted">Employee Remarks</dt>
                      <dd className="mt-1 font-semibold">{active.remarks}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">Date Submitted</dt>
                    <dd className="mt-1 font-semibold">{formatDateTime(active.submittedAt)}</dd>
                  </div>
                </dl>
              </section>

              {/* Update status. */}
              <section className="rounded-2xl border border-line p-5 md:p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">update status</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">New Status</span>
                    <select className="field-input" onChange={(e) => setDraftStatus(e.target.value as RequestStatus)} value={draftStatus}>
                      {ALL_STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">Internal Remarks (Optional)</span>
                    <input
                      className="field-input"
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Add a note for the audit trail…"
                      value={draftNote}
                    />
                  </label>
                </div>
                <p className="mt-4 text-xs text-muted">
                  Changes appear immediately on the employee tracking screen in this prototype. HRMD fulfilment still happens outside this demo.
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">Saved as {ADMIN_NAME}</p>
                  <button
                    className="btn btn-primary !min-h-12 !text-sm"
                    onClick={saveStatus}
                    type="button"
                  >
                    <Icon name="check" size={18} />
                    Save Status
                  </button>
                </div>
              </section>

              {/* Status history. */}
              <section className="rounded-2xl border border-line p-5 md:p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">status history</h3>
                <ol className="mt-4 space-y-0">
                  {active.history.map((event, index) => (
                    <li className="relative flex gap-4 pb-5 last:pb-0" key={`${event.status}-${event.at}`}>
                      <div className="flex flex-col items-center">
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-full ${index === 0 ? 'bg-brand-dark text-white' : 'bg-line text-muted'}`}
                        >
                          <Icon name={index === 0 ? 'check' : 'clock'} size={15} />
                        </span>
                        {index < active.history.length - 1 && <span className="h-full w-px bg-line" />}
                      </div>
                      <div>
                        <p className="font-bold">{t(statusLabelKey(event.status))}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {event.note ?? (event.by === 'Kiosk' ? 'Request recorded by the kiosk' : `Changed by ${event.by}`)
                          }
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{formatDateTime(event.at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="notice">
                <Icon className="mt-0.5 shrink-0" name="info" size={20} />
                <span>Status changes appear immediately on the employee tracking screen in this prototype. No email is sent; HRMD fulfilment happens outside this demo.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
