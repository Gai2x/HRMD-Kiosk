'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createTranslator } from '../../data/translations'
import { Icon } from '../../components/Icons'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { dayKey, formatDate, formatLongDay } from '../../lib/format'
import { useRequests } from '../../lib/request-store'
import { formatEmployeeName } from '../../lib/types'

export function DashboardScreen() {
  const t = useMemo(() => createTranslator('en') as (key: string) => string, [])
  const requests = useRequests()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === 'Pending').length,
      review: requests.filter((item) => item.status === 'Under Review').length,
      completed: requests.filter((item) => item.status === 'Completed').length,
      today: now ? requests.filter((item) => dayKey(item.submittedAt) === dayKey(now)).length : 0,
    }),
    [requests, now],
  )

  const recent = useMemo(
    () => [...requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5),
    [requests],
  )

  const metrics = [
    {
      label: 'Total Requests',
      value: String(counts.total),
      icon: 'document' as const,
      style: 'bg-brand-soft text-brand-dark',
      detail: `${counts.today} submitted today`,
    },
    {
      label: 'Pending Requests',
      value: String(counts.pending),
      icon: 'clock' as const,
      style: 'bg-amber-50 text-amber-600',
      detail: counts.pending > 0 ? 'Needs attention' : 'Queue is clear',
    },
    {
      label: 'Under Review',
      value: String(counts.review),
      icon: 'search' as const,
      style: 'bg-sky-50 text-sky-600',
      detail: 'In progress',
    },
    {
      label: 'Completed',
      value: String(counts.completed),
      icon: 'check' as const,
      style: 'bg-emerald-50 text-emerald-600',
      detail: counts.total > 0 ? `${counts.completed} finished` : '—',
    },
  ]

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start md:gap-6">
        <div>
          <p className="eyebrow">HRMD monitoring workspace</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            Request Overview
          </h1>
          <p className="mt-1 text-sm text-muted">Monitor and manage employee service requests.</p>
        </div>
        <p className="text-sm text-muted">{now ? formatLongDay(now) : 'Philippine Standard Time'}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className="card p-5" key={metric.label}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted">{metric.label}</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{metric.value}</p>
              </div>
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${metric.style}`}>
                <Icon name={metric.icon} size={22} />
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-muted">{metric.detail}</p>
          </div>
        ))}
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Latest requests</h2>
            <p className="mt-0.5 text-sm text-muted">The five most recent submissions.</p>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 py-2 text-sm font-bold text-brand-dark hover:bg-brand/20"
            href="/hrmd-admin/requests"
          >
            Open Requests
            <Icon name="chevronRight" size={16} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No requests have been filed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold">Reference</th>
                  <th className="px-5 py-3 text-xs font-bold">Employee</th>
                  <th className="px-5 py-3 text-xs font-bold">Submitted</th>
                  <th className="px-5 py-3 text-xs font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((row) => (
                  <tr className="transition hover:bg-surface/80" key={row.reference}>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-bold text-brand-dark">
                      {row.reference}
                    </td>
                    <td className="px-5 py-3">
                      <p className="truncate font-semibold">{formatEmployeeName(row.employee)}</p>
                      <p className="truncate text-xs text-muted">{row.employee.office}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-muted">{formatDate(row.submittedAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={row.status} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
