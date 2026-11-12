'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon, type IconName } from '../../components/Icons'
import { apiFetch } from '../../lib/api-client'
import { formatDateTime } from '../../lib/format'
import type { ActivityAction, ActivityEntry } from '../../lib/types'

type ActivityResponse = {
  entries: ActivityEntry[]
  total: number
  summary: {
    signInsToday: number
    signIns7d: number
    statusChanges7d: number
    rosterEdits7d: number
  }
}

type FilterKey = 'all' | 'sign_in' | 'sign_out' | 'request_status' | 'roster'

const FILTERS: { key: FilterKey; label: string; actions: ActivityAction[] }[] = [
  { key: 'all', label: 'All activity', actions: [] },
  { key: 'sign_in', label: 'Sign-ins', actions: ['sign_in'] },
  { key: 'sign_out', label: 'Sign-outs', actions: ['sign_out'] },
  { key: 'request_status', label: 'Status changes', actions: ['request_status'] },
  { key: 'roster', label: 'Roster edits', actions: ['employee_create', 'employee_update'] },
]

const ACTION_META: Record<ActivityAction, { label: string; tone: string; icon: IconName }> = {
  sign_in: { label: 'Sign in', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: 'shield' },
  sign_out: { label: 'Sign out', tone: 'bg-slate-100 text-slate-600 ring-slate-200', icon: 'logout' },
  request_status: { label: 'Status change', tone: 'bg-sky-50 text-sky-700 ring-sky-200', icon: 'clipboardCheck' },
  employee_create: { label: 'Roster added', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200', icon: 'people' },
  employee_update: { label: 'Roster edit', tone: 'bg-amber-50 text-amber-700 ring-amber-200', icon: 'people' },
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter((part) => !part.endsWith('.'))
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'HR'
}

function detailText(entry: ActivityEntry) {
  if (!entry.detail) return null
  const note = entry.detail.note
  const fields = entry.detail.fields
  if (typeof note === 'string' && note) return `Note: ${note}`
  if (Array.isArray(fields) && fields.length) return `Fields: ${fields.join(', ')}`
  return null
}

export function ActivityScreen() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<ActivityResponse['summary'] | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unauthorized'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)

  const actions = useMemo(() => FILTERS.find((item) => item.key === filter)?.actions ?? [], [filter])
  const actionsKey = actions.join(',')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 280)
    return () => clearTimeout(timer)
  }, [search])

  const buildQuery = useCallback(
    (offset: number) => {
      const params = new URLSearchParams()
      if (actionsKey) params.set('actions', actionsKey)
      if (query.trim()) params.set('q', query.trim())
      params.set('limit', '100')
      params.set('offset', String(offset))
      return params.toString()
    },
    [actionsKey, query],
  )

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    void (async () => {
      const result = await apiFetch<ActivityResponse>(`/api/activity?${buildQuery(0)}`)
      if (cancelled) return
      if (!result.ok) {
        setStatus(result.status === 401 ? 'unauthorized' : 'error')
        return
      }
      setEntries(result.data.entries)
      setTotal(result.data.total)
      setSummary(result.data.summary)
      setStatus('ready')
    })()

    return () => {
      cancelled = true
    }
  }, [buildQuery])

  const loadMore = async () => {
    setLoadingMore(true)
    const result = await apiFetch<ActivityResponse>(`/api/activity?${buildQuery(entries.length)}`)
    if (result.ok) {
      setEntries((current) => [...current, ...result.data.entries])
      setTotal(result.data.total)
    }
    setLoadingMore(false)
  }

  const cards = [
    { label: 'Sign-ins today', value: summary?.signInsToday ?? 0, icon: 'shield' as IconName, style: 'bg-emerald-50 text-emerald-600' },
    { label: 'Sign-ins (7 days)', value: summary?.signIns7d ?? 0, icon: 'logout' as IconName, style: 'bg-sky-50 text-sky-600' },
    { label: 'Status changes (7 days)', value: summary?.statusChanges7d ?? 0, icon: 'clipboardCheck' as IconName, style: 'bg-indigo-50 text-indigo-600' },
    { label: 'Roster edits (7 days)', value: summary?.rosterEdits7d ?? 0, icon: 'people' as IconName, style: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start md:gap-6">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Activity</h1>
          <p className="mt-1 text-sm text-muted">
            Every sign-in, status change and roster edit, recorded against the signed-in staff account.
          </p>
        </div>
        <span className="self-start rounded-lg bg-white px-3 py-2 text-xs font-bold text-muted ring-1 ring-line">
          {total} {total === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div className="card p-4" key={card.label}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{card.label}</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{card.value}</p>
              </div>
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${card.style}`}>
                <Icon name={card.icon} size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" name="search" size={18} />
            <input
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by staff, summary or reference…"
              value={search}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => {
              const active = filter === item.key
              return (
                <button
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    active ? 'bg-brand-soft text-brand-dark ring-1 ring-brand' : 'bg-surface text-ink hover:bg-white'
                  }`}
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {status === 'loading' && entries.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center gap-3 text-sm font-semibold text-muted">
            <span className="spinner" />
            Loading activity…
          </div>
        ) : status === 'unauthorized' ? (
          <div className="flex min-h-[200px] items-center justify-center p-8 text-center">
            <div>
              <Icon className="mx-auto mb-3 text-danger" name="shield" size={30} />
              <p className="font-display text-lg font-bold">Session expired</p>
              <p className="mt-1 text-sm text-muted">Sign in again to read the activity log.</p>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="flex min-h-[200px] items-center justify-center p-8 text-center">
            <div>
              <Icon className="mx-auto mb-3 text-danger" name="warning" size={30} />
              <p className="font-display text-lg font-bold">Could not load activity</p>
              <p className="mt-1 text-sm text-muted">Check the database connection and try again.</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center p-8 text-center">
            <div>
              <Icon className="mx-auto mb-3 text-muted" name="clock" size={30} />
              <p className="font-display text-lg font-bold">No activity yet</p>
              <p className="mt-1 text-sm text-muted">
                Sign-ins, status changes and roster edits will be listed here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold">When</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Staff</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Activity</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Details</th>
                    <th className="px-4 py-3.5 text-xs font-bold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {entries.map((entry) => {
                    const meta = ACTION_META[entry.action] ?? {
                      label: entry.action,
                      tone: 'bg-surface text-ink ring-line',
                      icon: 'clock' as IconName,
                    }
                    const extra = detailText(entry)
                    return (
                      <tr className="transition hover:bg-surface/80" key={entry.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                          {formatDateTime(entry.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.65rem] font-bold text-brand-dark">
                              {initials(entry.staffName)}
                            </span>
                            <span className="truncate text-sm font-bold text-ink">{entry.staffName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.tone}`}
                          >
                            <Icon name={meta.icon} size={13} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-ink">{entry.summary}</p>
                          {extra && <p className="mt-0.5 text-xs text-muted">{extra}</p>}
                          {entry.entityRef && (
                            <p className="mt-0.5 font-mono text-[0.7rem] text-brand-dark">{entry.entityRef}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                          {entry.ip ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {entries.length < total && (
              <div className="border-t border-line px-4 py-3 text-center">
                <button
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-surface disabled:opacity-60"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                  type="button"
                >
                  {loadingMore ? 'Loading…' : `Load ${Math.min(100, total - entries.length)} more`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-white px-4 py-3 text-xs leading-relaxed text-muted ring-1 ring-line">
        <Icon className="mt-0.5 shrink-0" name="shield" size={15} />
        Entries are written server-side against the signed-in session, so they cannot be attributed to another
        staff member. Roster edits record which fields changed, never the values.
      </p>
    </div>
  )
}
