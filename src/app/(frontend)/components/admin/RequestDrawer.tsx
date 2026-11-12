'use client'

import { useEffect, useMemo, useState } from 'react'
import { createTranslator } from '../../data/translations'
import { formatDateTime, statusLabelKey } from '../../lib/format'
import { updateRequestStatus } from '../../lib/request-store'
import {
  ALL_STATUSES,
  employeeInitials,
  formatEmployeeName,
  type HrmdRequest,
  type RequestStatus,
} from '../../lib/types'
import { getOptionKey, serviceLabel } from '../../lib/admin-utils'
import { Icon } from '../Icons'
import { StatusBadge } from './StatusBadge'

export function RequestDrawer({
  request,
  actor,
  onClose,
}: {
  request: HrmdRequest
  actor: string
  onClose: () => void
}) {
  const t = useMemo(() => createTranslator('en') as (key: string) => string, [])
  const [draftStatus, setDraftStatus] = useState<RequestStatus>(request.status)
  const [draftNote, setDraftNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setDraftStatus(request.status)
    setDraftNote('')
    setError('')
  }, [request.reference, request.status])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateRequestStatus(request.reference, draftStatus, {
        note: draftNote,
        actor,
      })
      if (!updated) {
        setError('That request no longer exists.')
        return
      }
      setDraftNote('')
      setNotice(`Status updated to “${draftStatus}”.`)
      setTimeout(() => setNotice(''), 3200)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The status could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const optionKey = getOptionKey(request.service, request.optionId)

  return (
    <div
      className="animate-fade fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label={`Request details ${request.reference}`}
        aria-modal="true"
        className="animate-pop flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-dark">Request details</p>
            <h2 className="mt-0.5 truncate font-mono text-lg font-bold leading-tight text-ink">
              {request.reference}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={request.status} t={t} />
            <button
              aria-label="Close details"
              className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
              onClick={onClose}
              type="button"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-line p-4">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Employee</h3>
              <div className="mt-2 flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
                  {employeeInitials(request.employee)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{formatEmployeeName(request.employee)}</p>
                  <p className="truncate text-xs text-muted">{request.employee.position}</p>
                  <p className="truncate text-xs text-muted">{request.employee.email}</p>
                  <p className="truncate text-xs text-muted">{request.employee.contact}</p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Office</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-ink">{request.employee.office || '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Employment</dt>
                  <dd className="mt-0.5 truncate text-sm font-semibold text-ink">
                    {request.employee.employmentStatus || '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-line p-4">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Request information</h3>
              <dl className="mt-2 grid grid-cols-2 gap-3">
                <div className="col-span-2 min-w-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Request type</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">
                    {serviceLabel(request.service)}
                    {optionKey && <span className="block text-xs font-medium text-muted">{t(optionKey)}</span>}
                    {request.service === 'others' && request.othersSpecified && (
                      <span className="block text-xs font-medium text-muted">{request.othersSpecified}</span>
                    )}
                  </dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Purpose</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">{request.purpose}</dd>
                </div>
                {request.copies ? (
                  <div className="min-w-0">
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Copies</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">{request.copies}</dd>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Submitted</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">{formatDateTime(request.submittedAt)}</dd>
                </div>
                {request.remarks && (
                  <div className="col-span-2 min-w-0">
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">
                      Employee remarks
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">{request.remarks}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="rounded-xl border border-line p-4">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Update status</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-ink">New status</span>
                  <select
                    className="field-input !min-h-11"
                    onChange={(event) => setDraftStatus(event.target.value as RequestStatus)}
                    value={draftStatus}
                  >
                    {ALL_STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-ink">Internal remarks (optional)</span>
                  <input
                    className="field-input !min-h-11"
                    onChange={(event) => setDraftNote(event.target.value)}
                    placeholder="Add a note…"
                    value={draftNote}
                  />
                </label>
              </div>
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-danger">
                  <Icon name="warning" size={14} />
                  {error}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.7rem] text-muted">Saved as {actor} · shows instantly on tracking</p>
                <button
                  className="btn btn-primary !min-h-10 !px-4 !text-xs"
                  disabled={saving}
                  onClick={() => void save()}
                  type="button"
                >
                  <Icon name="check" size={16} />
                  {saving ? 'Saving…' : 'Save status'}
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-line p-4">
              <h3 className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Status history</h3>
              <ol className="mt-2 space-y-2">
                {request.history.map((event, index) => (
                  <li className="flex gap-2.5" key={`${event.status}-${event.at}`}>
                    <span
                      className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                        index === 0 ? 'bg-brand-dark text-white' : 'bg-line text-muted'
                      }`}
                    >
                      <Icon name={index === 0 ? 'check' : 'clock'} size={13} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{t(statusLabelKey(event.status))}</p>
                      <p className="text-xs text-muted">
                        {event.note ??
                          (event.by === 'Kiosk' ? 'Request recorded by the kiosk' : `Changed by ${event.by}`)}
                      </p>
                      <p className="text-[0.65rem] text-slate-400">{formatDateTime(event.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[0.7rem] leading-relaxed text-muted">
            Status changes appear on the employee tracking screen. No email is sent; HRMD fulfilment happens
            outside this system.
          </p>
        </div>
      </div>

      {notice && (
        <div className="animate-rise fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-ink px-5 py-4 font-bold text-white shadow-2xl">
          <Icon name="check" size={20} />
          {notice}
        </div>
      )}
    </div>
  )
}
