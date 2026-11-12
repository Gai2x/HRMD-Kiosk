import { statusLabelKey, statusTone } from '../../lib/format'
import type { RequestStatus } from '../../lib/types'

export function StatusBadge({
  status,
  t,
}: {
  status: RequestStatus
  t: (key: string) => string
}) {
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
