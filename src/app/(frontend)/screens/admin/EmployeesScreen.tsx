'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icons'
import { apiFetch, isUnavailable } from '../../lib/api-client'
import { formatRate } from '../../lib/admin-utils'
import { formatDate } from '../../lib/format'
import { SEED_REQUESTS } from '../../data/mockRequests'
import type { EmployeeRecord } from '../../lib/types'

type RosterState =
  | { status: 'loading' }
  | { status: 'ready'; employees: EmployeeRecord[]; total: number }
  | { status: 'demo'; employees: EmployeeRecord[] }
  | { status: 'error'; message: string }

/** Roster derived from the demo requests so the module is explorable pre-MySQL. */
function buildDemoRoster(): EmployeeRecord[] {
  const byName = new Map<string, EmployeeRecord>()

  for (const request of [...SEED_REQUESTS].reverse()) {
    const { employee } = request
    const key = `${employee.firstName}|${employee.lastName}`
    const existing = byName.get(key)

    if (existing) {
      existing.requestCount = (existing.requestCount ?? 0) + 1
      if (!existing.lastRequestAt || request.submittedAt > existing.lastRequestAt) {
        existing.lastRequestAt = request.submittedAt
      }
      continue
    }

    byName.set(key, {
      id: byName.size + 1,
      employeeNo: `EMP-${String(byName.size + 1).padStart(4, '0')}`,
      firstName: employee.firstName,
      middleName: employee.middleName,
      lastName: employee.lastName,
      suffix: employee.suffix,
      position: employee.position,
      office: employee.office,
      employmentStatus: employee.employmentStatus,
      email: employee.email,
      contact: employee.contact,
      salaryGrade: null,
      rate: null,
      source: 'seed',
      createdAt: request.submittedAt,
      updatedAt: request.submittedAt,
      requestCount: 1,
      lastRequestAt: request.submittedAt,
    })
  }

  return [...byName.values()].sort((a, b) => a.lastName.localeCompare(b.lastName))
}

/** Clipboard write with a legacy fallback for insecure contexts or old browsers. */
async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Permission denied or a non-secure origin: fall back to execCommand.
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-9999px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

function CopyButton({
  label,
  copied,
  onCopy,
}: {
  label: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <button
      aria-label={label}
      className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
      onClick={(event) => {
        // Copying must never bubble into a row click or navigation.
        event.stopPropagation()
        onCopy()
      }}
      title={label}
      type="button"
    >
      {copied ? (
        <Icon className="text-emerald-600" name="check" size={14} />
      ) : (
        <Icon name="copy" size={14} />
      )}
    </button>
  )
}

export function EmployeesScreen() {
  const [state, setState] = useState<RosterState>({ status: 'loading' })
  const [search, setSearch] = useState('')
  const [office, setOffice] = useState('All')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
  }, [])

  const handleCopy = async (key: string, value: string, message: string) => {
    const copied = await copyText(value)
    if (!copied) return

    setCopiedKey(key)
    setToast(message)
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => {
      setCopiedKey(null)
      setToast(null)
    }, 1500)
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const result = await apiFetch<{ employees: EmployeeRecord[]; total: number }>('/api/employees?limit=200')
      if (cancelled) return

      if (result.ok) {
        setState({ status: 'ready', employees: result.data.employees, total: result.data.total })
        return
      }
      if (isUnavailable(result)) {
        setState({ status: 'demo', employees: buildDemoRoster() })
        return
      }
      setState({ status: 'error', message: result.message ?? 'The roster could not be loaded.' })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const employees = state.status === 'ready' || state.status === 'demo' ? state.employees : []

  const offices = useMemo(
    () => [...new Set(employees.map((employee) => employee.office).filter(Boolean))].sort(),
    [employees],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return employees.filter((employee) => {
      if (office !== 'All' && employee.office !== office) return false
      if (!needle) return true
      return `${employee.firstName} ${employee.middleName} ${employee.lastName} ${employee.employeeNo ?? ''} ${employee.email} ${employee.office} ${employee.position}`
        .toLowerCase()
        .includes(needle)
    })
  }, [employees, search, office])

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start md:gap-6">
        <div>
          <p className="eyebrow">Employee records</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Employees</h1>
          <p className="mt-1 text-sm text-muted">
            The HRMD roster used by the kiosk name lookup, with personal contacts and request history.
          </p>
        </div>
        <span className="self-start rounded-lg bg-white px-3 py-2 text-xs font-bold text-muted ring-1 ring-line">
          {state.status === 'ready' ? `${state.total} on file` : `${employees.length} listed`}
        </span>
      </div>

      {state.status === 'demo' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Icon className="mt-0.5 shrink-0 text-amber-600" name="info" size={18} />
          <p className="leading-relaxed">
            <span className="font-bold">Preview roster.</span> These rows come from the sample requests because
            MySQL is not connected. Once the database is running, this module lists the real <code className="font-mono text-xs">employees</code> table.
          </p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Icon className="mt-0.5 shrink-0" name="warning" size={18} />
          <p className="leading-relaxed">{state.message}</p>
        </div>
      )}

      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" name="search" size={18} />
            <input
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, employee no., email or position…"
              value={search}
            />
          </div>
          <select
            className="h-11 min-w-[180px] rounded-xl border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand"
            onChange={(event) => setOffice(event.target.value)}
            value={office}
          >
            <option value="All">All offices</option>
            {offices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {state.status === 'loading' ? (
          <div className="flex min-h-[220px] items-center justify-center gap-3 text-sm font-semibold text-muted">
            <span className="spinner" />
            Loading roster…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center p-8 text-center">
            <div>
              <Icon className="mx-auto mb-3 text-muted" name="people" size={30} />
              <p className="font-display text-lg font-bold">No employees found</p>
              <p className="mt-1 text-sm text-muted">
                {employees.length === 0
                  ? 'The roster is empty. Employees imported from Excel will appear here.'
                  : 'Try a different name, employee number or office.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold">Employee</th>
                  <th className="px-4 py-3.5 text-xs font-bold">Employee No.</th>
                  <th className="px-4 py-3.5 text-xs font-bold">SG / Rate</th>
                  <th className="px-4 py-3.5 text-xs font-bold">Office</th>
                  <th className="px-4 py-3.5 text-xs font-bold">Email</th>
                  <th className="px-4 py-3.5 text-xs font-bold">Phone</th>
                  <th className="px-4 py-3.5 text-xs font-bold">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((employee) => (
                  <tr className="transition hover:bg-surface/80" key={employee.id}>
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.65rem] font-bold text-brand-dark">
                          {`${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">
                            {[employee.lastName, employee.firstName].filter(Boolean).join(', ')}
                          </p>
                          <p className="truncate text-xs text-muted">{employee.position || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-bold text-muted">
                      {employee.employeeNo || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                      <span className="font-semibold">{employee.salaryGrade ?? '—'}</span>
                      <span className="text-muted"> / {formatRate(employee.rate)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex max-w-[220px] truncate rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink ring-1 ring-line">
                        {employee.office || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {employee.email ? (
                        <div className="flex items-center gap-1">
                          <span className="block max-w-[200px] truncate text-sm text-ink" title={employee.email}>
                            {employee.email}
                          </span>
                          <CopyButton
                            copied={copiedKey === `email-${employee.id}`}
                            label="Copy email"
                            onCopy={() => void handleCopy(`email-${employee.id}`, employee.email, 'Email copied')}
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-ink">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-muted">
                      {employee.contact ? (
                        <div className="flex items-center gap-1">
                          <span>{employee.contact}</span>
                          <CopyButton
                            copied={copiedKey === `phone-${employee.id}`}
                            label="Copy phone number"
                            onCopy={() => void handleCopy(`phone-${employee.id}`, employee.contact, 'Phone number copied')}
                          />
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-dark">
                          {employee.requestCount ?? 0}
                        </span>
                        <span className="whitespace-nowrap text-[0.7rem] text-muted">
                          {employee.lastRequestAt ? formatDate(employee.lastRequestAt) : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {toast && (
        <div
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-xl"
          role="status"
        >
          <Icon className="text-emerald-400" name="check" size={16} />
          {toast}
        </div>
      )}
    </div>
  )
}
