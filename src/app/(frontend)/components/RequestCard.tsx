'use client'

import type { RequestTypeConfig } from '../data/requestTypes'
import type { Translator } from '../data/translations'
import { Icon } from './Icons'

/**
 * Touch-first service tile. One per entry in REQUEST_TYPES.
 * `dense` is the compact form used by the landing page so all six tiles fit on
 * a single kiosk screen; it drops the (always unselected) trailing check mark.
 */
export function RequestCard({
  config,
  selected,
  onSelect,
  t,
  dense = false,
}: {
  config: RequestTypeConfig
  selected: boolean
  onSelect: () => void
  t: Translator
  dense?: boolean
}) {
  return (
    <button
      aria-pressed={selected}
      className={`service-card h-full w-full ${dense ? 'min-h-0 gap-2.5 rounded-2xl p-4' : ''}`}
      data-selected={selected}
      onClick={onSelect}
      type="button"
    >
      <span
        className={`grid shrink-0 place-items-center bg-brand-soft text-brand-dark ${
          dense ? 'size-11 rounded-xl' : 'size-[4.5rem] rounded-2xl'
        }`}
      >
        <Icon name={config.icon} size={dense ? 22 : 36} />
      </span>
      <span className="min-w-0">
        <span
          className={`block font-display font-bold leading-snug text-ink ${
            dense ? 'text-[1.05rem]' : 'text-xl'
          }`}
        >
          {t(config.labelKey)}
        </span>
        <span
          className={`block leading-relaxed text-muted ${
            dense ? 'mt-1.5 line-clamp-2 text-[0.82rem]' : 'mt-2 text-[0.95rem]'
          }`}
        >
          {t(config.descKey)}
        </span>
      </span>
      {!dense && (
        <span className="mt-auto flex w-full items-center justify-end pt-4">
          <span
            className={`grid size-8 place-items-center rounded-full border-2 transition ${
              selected ? 'border-brand-dark bg-brand-dark text-white' : 'border-line text-transparent'
            }`}
          >
            <Icon name="check" size={18} />
          </span>
        </span>
      )}
    </button>
  )
}
