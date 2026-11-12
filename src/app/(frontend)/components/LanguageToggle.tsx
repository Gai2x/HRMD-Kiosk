'use client'

import { LANGUAGE_OPTIONS, type Translator } from '../data/translations'
import type { Lang } from '../lib/types'
import { Icon } from './Icons'

/**
 * English / Tagalog / Cebuano switch. Selection is visual only — the parent owns
 * the language state, so the employee's form data survives a language change.
 *
 * `variant="bare"` drops the decorative card entirely (landing page); the active
 * language is still a solid white pill with dark navy text.
 */
export function LanguageToggle({
  lang,
  onChange,
  t,
  inverse = false,
  variant = 'card',
}: {
  lang: Lang
  onChange: (lang: Lang) => void
  t: Translator
  inverse?: boolean
  variant?: 'card' | 'bare'
}) {
  if (variant === 'bare') {
    return (
      <div aria-label={t('lang.label')} className="flex shrink-0 items-center gap-1" role="group">
        {LANGUAGE_OPTIONS.map((option) => {
          const active = option.lang === lang
          return (
            <button
              aria-pressed={active}
              className={`min-h-11 whitespace-nowrap rounded-full px-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                inverse
                  ? 'focus-visible:outline-white'
                  : 'focus-visible:outline-brand-dark'
              } ${
                active
                  ? inverse
                    ? 'bg-white text-ink shadow-sm'
                    : 'bg-ink text-white shadow-sm'
                  : inverse
                    ? 'text-white/75 hover:bg-white/10 hover:text-white'
                    : 'text-ink/65 hover:bg-white/40 hover:text-ink'
              }`}
              key={option.lang}
              onClick={() => onChange(option.lang)}
              type="button"
            >
              {t(option.key)}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      aria-label={t('lang.label')}
      className={`flex shrink-0 items-center gap-0.5 rounded-xl p-1 sm:gap-1 ${
        inverse ? 'bg-white/10 ring-1 ring-white/25' : 'bg-surface ring-1 ring-line'
      }`}
      role="group"
    >
      <Icon
        className={`hidden shrink-0 sm:mx-2 sm:block ${inverse ? 'text-white/70' : 'text-muted'}`}
        name="globe"
        size={18}
      />
      {LANGUAGE_OPTIONS.map((option) => {
        const active = option.lang === lang
        return (
          <button
            aria-pressed={active}
            className={`min-h-11 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition sm:px-3.5 ${
              active
                ? inverse
                  ? 'bg-white text-ink'
                  : 'bg-white text-ink shadow-sm ring-1 ring-line'
                : inverse
                  ? 'text-white/75 hover:text-white'
                  : 'text-muted hover:text-ink'
            }`}
            key={option.lang}
            onClick={() => onChange(option.lang)}
            type="button"
          >
            {t(option.key)}
          </button>
        )
      })}
    </div>
  )
}
