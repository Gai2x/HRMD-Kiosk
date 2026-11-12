import type { RequestStatus } from './types'
import { STATUS_FLOW } from './types'
import type { TranslationKey } from '../data/translations'

/**
 * Dates are pinned to Philippine time so server-rendered HTML and the hydrated
 * client output always agree, whatever timezone the machine is in.
 */
const TIME_ZONE = 'Asia/Manila'

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'long',
  timeZone: TIME_ZONE,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})

const clockFormatter = new Intl.DateTimeFormat('en-PH', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

// dateStyle cannot be combined with individual part options, so parts are explicit.
const longDayFormatter = new Intl.DateTimeFormat('en-PH', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: TIME_ZONE,
})

const receiptFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: TIME_ZONE,
})

export function formatDate(value: string | Date) {
  return dateFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

export function formatClock(value: Date) {
  return clockFormatter.format(value)
}

export function formatLongDay(value: Date) {
  return longDayFormatter.format(value)
}

/** Compact stamp for the virtual receipt, e.g. "Nov 10, 2026, 09:14 AM". */
export function formatReceiptStamp(value: string | Date) {
  return receiptFormatter.format(typeof value === 'string' ? new Date(value) : value)
}

/** Stable YYYY-MM-DD key in Philippine time, for grouping and day comparisons. */
export function dayKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

/* ------------------------------------------------------------------ privacy */

/** Masks an email for staff-facing views: maria.delacruz@x → m••••@x */
export function maskEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return '—'
  const at = trimmed.indexOf('@')
  if (at <= 0) return '••••'
  return `${trimmed[0]}${'•'.repeat(Math.min(Math.max(at - 1, 3), 6))}${trimmed.slice(at)}`
}

/** Masks all but the last four digits of a contact number. */
export function maskContact(contact: string) {
  const digits = contact.replace(/\D/g, '')
  if (digits.length < 4) return '••••'
  return `•••• ••• ${digits.slice(-4)}`
}

/* ------------------------------------------------------------------- status */

export type StatusTone = {
  badge: string
  dot: string
  accent: string
}

export function statusTone(status: RequestStatus): StatusTone {
  switch (status) {
    case 'Completed':
      return {
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        dot: 'bg-emerald-500',
        accent: 'from-emerald-500 to-emerald-600',
      }
    case 'Response Sent via Email':
      return {
        badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
        dot: 'bg-indigo-500',
        accent: 'from-indigo-500 to-indigo-600',
      }
    case 'Under Review':
      return {
        badge: 'bg-sky-50 text-sky-700 ring-sky-200',
        dot: 'bg-sky-500',
        accent: 'from-sky-500 to-sky-600',
      }
    case 'Pending':
      return {
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
        dot: 'bg-amber-500',
        accent: 'from-amber-500 to-amber-600',
      }
    default:
      return {
        badge: 'bg-red-50 text-red-700 ring-red-200',
        dot: 'bg-red-500',
        accent: 'from-red-500 to-red-600',
      }
  }
}

/** 0-based position in the happy-path pipeline; -1 for "Unable to Process". */
export function statusStageIndex(status: RequestStatus) {
  return STATUS_FLOW.indexOf(status)
}

/** Translation keys for a status and its description. */
export function statusLabelKey(status: RequestStatus) {
  return `status.${status}` as TranslationKey
}

export function statusDescriptionKey(status: RequestStatus) {
  return `status.${status}.desc` as TranslationKey
}

/* -------------------------------------------------------------- validation */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

/** Accepts 09XXXXXXXXX (11 digits) or a +63 form, tolerating spaces and dashes. */
export function isValidContact(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('09')
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}
