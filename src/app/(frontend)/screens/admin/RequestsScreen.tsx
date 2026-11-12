'use client'

import { useMemo, useState } from 'react'
import { createTranslator } from '../../data/translations'
import { Icon } from '../../components/Icons'
import { RequestDrawer } from '../../components/admin/RequestDrawer'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { FILTERS, getOptionKey, matchesFilter, serviceLabel } from '../../lib/admin-utils'
import { formatDate } from '../../lib/format'
import { useRequests } from '../../lib/request-store'
import { formatEmployeeName } from '../../lib/types'
import { useStaffIdentity } from '../../components/admin/AdminSession'

export function RequestsScreen() {
  const t = useMemo(() => createTranslator('en') as (key: string) => string, [])
  const { adminName } = useStaffIdentity()
  const requests = useRequests()

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [activeRef, setActiveRef] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      requests.filter((item) => {
        const haystack = `${item.reference} ${formatEmployeeName(item.employee)} ${item.employee.office} ${serviceLabel(item.service)}`
        return haystack.toLowerCase().includes(search.trim().toLowerCase()) && matchesFilter(item, filter)
      }),
    [requests, search, filter],
  )

  const sorted = useMemo(() => {
    const copy = [...filtered]
    return copy.sort((a, b) =>
      sort === 'newest' ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt),
    )
  }, [filtered, sort])

  const active = activeRef ? (requests.find((item) => item.reference === activeRef) ?? null) : null
  const activeFilters = filter !== 'All' || search.trim().length > 0

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start md:gap-6">
        <div>
          <p className="eyebrow">Request management</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Requests</h1>
          <p className="mt-1 text-sm text-muted">Search, filter, and review incoming employee requests.</p>
        </div>
        <span className="swatch self-start rounded-lg bg-white px-3 py-2 text-xs font-bold text-muted ring-1 ring-line">
          Showing {sorted.length} of {requests.length}
        </span>
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" name="search" size={18} />
            <input
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, office or reference…"
              value={search}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="h-11 min-w-[150px] rounded-xl border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand"
              onChange={(event) => setFilter(event.target.value)}
              value={filter}
            >
              {FILTERS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            {activeFilters && (
              <button
                className="shrink-0 rounded-xl border border-brand bg-brand-soft px-3 text-sm font-bold text-brand-dark hover:bg-brand/20"
                onClick={() => {
                  setFilter('All')
                  setSearch('')
                }}
                type="button"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span className="hidden sm:inline">Sort</span>
            <button
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                sort === 'newest' ? 'bg-brand-soft text-brand-dark ring-1 ring-brand' : 'bg-surface text-ink'
              }`}
              onClick={() => setSort('newest')}
              type="button"
            >
              Newest
            </button>
            <button
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                sort === 'oldest' ? 'bg-brand-soft text-brand-dark ring-1 ring-brand' : 'bg-surface text-ink'
              }`}
              onClick={() => setSort('oldest')}
              type="button"
            >
              Oldest
            </button>
          </div>
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
                <th className="px-4 py-3.5 text-right text-xs font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((row) => {
                const optionKey = getOptionKey(row.service, row.optionId)
                const othersLabel =
                  row.service === 'others' && row.othersSpecified ? ` — ${row.othersSpecified}` : ''
                return (
                  <tr className="transition hover:bg-surface/90" key={row.reference}>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm font-bold text-brand-dark">
                      {row.reference}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{formatEmployeeName(row.employee)}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">{row.employee.position}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <div>
                        <p className="font-semibold">
                          {serviceLabel(row.service)}
                          {othersLabel}
                        </p>
                        {optionKey && <p className="mt-0.5 text-xs text-muted">{t(optionKey)}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink ring-1 ring-line">
                        {row.employee.office || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted">{formatDate(row.submittedAt)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={row.status} t={t} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold text-brand-dark hover:bg-surface"
                        onClick={() => setActiveRef(row.reference)}
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
            <div className="flex min-h-[180px] items-center justify-center border-t border-line bg-surface/40 p-8 text-center">
              <div>
                <Icon className="mx-auto mb-3 text-muted" name="search" size={30} />
                <p className="font-display text-lg font-bold">No matching requests</p>
                <p className="mt-1 text-sm text-muted">Try a different search or clear the filter.</p>
                {activeFilters && (
                  <button
                    className="mt-4 rounded-lg bg-brand-soft px-4 py-1.5 text-sm font-bold text-brand-dark hover:bg-brand/20"
                    onClick={() => {
                      setFilter('All')
                      setSearch('')
                    }}
                    type="button"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {active && <RequestDrawer actor={adminName} onClose={() => setActiveRef(null)} request={active} />}
    </div>
  )
}
