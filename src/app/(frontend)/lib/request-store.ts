'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { SEED_REQUESTS } from '../data/mockRequests'
import { apiFetch, isUnavailable } from './api-client'
import type { HrmdRequest, RequestDraft, RequestStatus } from './types'

/**
 * Request data for the kiosk and the HRMD workspace.
 *
 * Reads come from MySQL through `/api/requests`. While the database is not
 * configured or unreachable (`503 database-unavailable`) the store keeps the
 * prototype's in-memory seed so the kiosk and dashboard stay usable, and the
 * admin shell shows a "demo mode" banner instead of failing silently.
 */

export type DataMode = 'loading' | 'database' | 'demo'

let requests: HrmdRequest[] = SEED_REQUESTS
let mode: DataMode = 'loading'
let lastError: string | null = null
let inFlight: Promise<boolean> | null = null
let lastAttemptAt = 0

/** While the database is unavailable, stop hammering the API on every poll. */
const DEMO_RETRY_MS = 5 * 60_000

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/* --------------------------------------------------------------- snapshots */

export function useRequests() {
  return useSyncExternalStore(
    subscribe,
    () => requests,
    () => requests,
  )
}

export function useDataMode(): DataMode {
  return useSyncExternalStore(
    subscribe,
    () => mode,
    () => mode,
  )
}

export function getDataMode() {
  return mode
}

export function getDataError() {
  return lastError
}

/* ------------------------------------------------------------------ reads */

export function getRequests() {
  return requests
}

export function findRequest(reference: string) {
  const needle = reference.trim().toUpperCase()
  return requests.find((item) => item.reference.toUpperCase() === needle)
}

export function lookupRequest(reference: string) {
  const ref = reference.trim().toUpperCase()
  if (!ref) return { ok: false as const, reason: 'required' as const }
  const request = requests.find((item) => item.reference.toUpperCase() === ref)
  if (!request) return { ok: false as const, reason: 'not-found' as const }
  return { ok: true as const, request }
}

/**
 * Tracking lookup for the kiosk.
 *
 * Uses the public `/api/tracking/[reference]` endpoint (reference only, no
 * contact details) so the kiosk never needs the staff-only request listing.
 * Falls back to the in-session cache used by demo mode.
 */
export async function lookupRequestRemote(reference: string) {
  const ref = reference.trim().toUpperCase()
  if (!ref) return { ok: false as const, reason: 'required' as const }

  const cached = requests.find((item) => item.reference.toUpperCase() === ref)
  if (cached) return { ok: true as const, request: cached }

  const result = await apiFetch<HrmdRequest>(`/api/tracking/${encodeURIComponent(ref)}`)
  if (result.ok) return { ok: true as const, request: result.data }
  return { ok: false as const, reason: 'not-found' as const }
}

/** Pulls the latest requests from MySQL. Safe to call repeatedly. */
export async function refreshRequests(options: { force?: boolean } = {}): Promise<boolean> {
  if (inFlight) return inFlight
  if (!options.force && mode === 'demo' && Date.now() - lastAttemptAt < DEMO_RETRY_MS) return false

  lastAttemptAt = Date.now()

  inFlight = (async () => {
    const result = await apiFetch<HrmdRequest[]>('/api/requests?limit=200')
    if (result.ok) {
      requests = result.data
      mode = 'database'
      lastError = null
    } else {
      mode = 'demo'
      lastError = result.message ?? 'MySQL is not connected.'
    }
    emit()
    return result.ok
  })()

  try {
    return await inFlight
  } finally {
    inFlight = null
  }
}

/** Refresh on mount, on focus, and on a slow interval while the tab is visible. */
export function useRequestSync(intervalMs = 20_000) {
  useEffect(() => {
    void refreshRequests()

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refreshRequests()
    }, intervalMs)

    const onFocus = () => void refreshRequests({ force: true })
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [intervalMs])
}

/* --------------------------------------------------------------- commands */

/** Next sequential reference for the current year, e.g. HR-2026-0007. */
export function nextReference(now: Date) {
  const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric' })
    .format(now)
    .slice(0, 4)
  const prefix = `HR-${year}-`
  const highest = requests.reduce((max, item) => {
    if (!item.reference.startsWith(prefix)) return max
    const parsed = Number.parseInt(item.reference.slice(prefix.length), 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}

function createLocalRequest(draft: RequestDraft, now: Date): HrmdRequest {
  const submittedAt = now.toISOString()
  const { othersSpecified, ...rest } = draft
  return {
    ...rest,
    othersSpecified: othersSpecified || undefined,
    reference: nextReference(now),
    submittedAt,
    status: 'Pending',
    history: [{ status: 'Pending', at: submittedAt, by: 'Kiosk' }],
  }
}

function useDemoFallback(error?: string) {
  mode = 'demo'
  lastError = error ?? 'MySQL is not connected.'
}

/** Records a request. Persists to MySQL when available, otherwise in memory. */
export async function submitRequest(draft: RequestDraft, now = new Date()): Promise<HrmdRequest> {
  const result = await apiFetch<HrmdRequest>('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      service: draft.service,
      optionId: draft.optionId,
      purpose: draft.purpose,
      copies: draft.copies,
      remarks: draft.remarks,
      othersSpecified: draft.othersSpecified,
      employeeId: draft.employee.employeeId ?? null,
      employee: draft.employee,
    }),
  })

  if (result.ok) {
    requests = [result.data, ...requests]
    mode = 'database'
    lastError = null
    emit()
    return result.data
  }

  if (!isUnavailable(result)) {
    throw new Error(result.message ?? 'The request could not be saved.')
  }

  useDemoFallback(result.message)
  const created = createLocalRequest(draft, now)
  requests = [created, ...requests]
  emit()
  return created
}

/** Appends a status change to a request's audit trail. */
export async function updateRequestStatus(
  reference: string,
  status: RequestStatus,
  options: { note?: string; actor?: string; now?: Date } = {},
): Promise<HrmdRequest | null> {
  const result = await apiFetch<HrmdRequest>(`/api/requests/${encodeURIComponent(reference)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note: options.note, actor: options.actor }),
  })

  if (result.ok) {
    requests = requests.map((item) => (item.reference === reference ? result.data : item))
    mode = 'database'
    lastError = null
    emit()
    return result.data
  }

  if (!isUnavailable(result)) {
    throw new Error(result.message ?? 'The status could not be saved.')
  }

  useDemoFallback(result.message)
  const at = (options.now ?? new Date()).toISOString()
  const note = options.note?.trim()

  requests = requests.map((item) =>
    item.reference === reference
      ? {
          ...item,
          status,
          history: [
            { status, at, by: options.actor ?? 'HRMD staff', note: note || undefined },
            ...item.history,
          ],
        }
      : item,
  )
  emit()
  return requests.find((item) => item.reference === reference) ?? null
}
