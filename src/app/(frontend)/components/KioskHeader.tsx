'use client'

import type { Translator } from '../data/translations'
import { Icon } from './Icons'

/**
 * Minimal in-flow bar for every screen after the landing page. The landing
 * page owns its own branded header; the clock, language selector and logo
 * lockup deliberately do not appear here. The red Cancel button ends the
 * session immediately, per the privacy spec.
 */
export function KioskHeader({ onCancel, t }: { onCancel: () => void; t: Translator }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-10">
        <p className="min-w-0 truncate text-sm font-bold text-muted">{t('brand.kioskShort')}</p>
        <button
          className="btn btn-danger !min-h-11 !px-4 !text-sm sm:!px-5"
          onClick={onCancel}
          type="button"
        >
          <Icon name="x" size={18} />
          {t('common.cancel')}
        </button>
      </div>
    </header>
  )
}
