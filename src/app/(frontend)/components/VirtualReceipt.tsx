'use client'

import type { Translator } from '../data/translations'
import { formatReceiptStamp } from '../lib/format'
import { formatEmployeeName, type HrmdRequest } from '../lib/types'

/**
 * Virtual receipt styled as a thermal paper ticket.
 * The `.receipt-print` class limits `window.print()` output to this element.
 */
export function VirtualReceipt({
  request,
  typeLabel,
  statusLabel,
  t,
}: {
  request: HrmdRequest
  typeLabel: string
  statusLabel: string
  t: Translator
}) {
  const rows: Array<[string, string]> = [
    [t('success.name'), formatEmployeeName(request.employee)],
    [t('success.type'), typeLabel],
    [t('success.dateTime'), formatReceiptStamp(request.submittedAt)],
    [t('success.email'), request.employee.email],
    [t('success.status'), statusLabel],
    ...(request.service === 'others' && request.optionId === 'others_specify' && request.othersSpecified
      ? [[t('details.othersSpecified'), request.othersSpecified] as [string, string]]
      : []),
  ]

  return (
    <div className="receipt-print relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-t-lg bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] ring-1 ring-line">
        <div className="border-x border-t border-dashed border-line bg-surface px-6 py-5 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-ink">
            {t('success.org')}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('success.reference')}
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-brand-dark">
            {request.reference}
          </p>
        </div>

        <div className="px-6 py-5">
          <dl className="space-y-3">
            {rows.map(([label, value]) => (
              <div className="flex items-baseline justify-between gap-4" key={label}>
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                  {label}
                </dt>
                <dd className="text-right text-sm font-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="my-4 border-t border-dashed border-line" />
          <p className="text-center font-mono text-[0.7rem] leading-relaxed text-muted">
            {t('brand.kiosk')}
            <br />
            {t('brand.lgu')}
          </p>
        </div>
      </div>

      {/* Perforated paper edge */}
      <div
        aria-hidden="true"
        className="h-3 w-full rounded-b-lg bg-[linear-gradient(-45deg,transparent_50%,white_50%),linear-gradient(45deg,transparent_50%,white_50%)] bg-[length:12px_12px] bg-repeat-x"
      />
    </div>
  )
}
