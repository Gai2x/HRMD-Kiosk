import type { TranslationKey, Translator } from '../data/translations'
import { Icon } from './Icons'

const STEPS: TranslationKey[] = ['progress.employee', 'progress.details', 'progress.review']

/**
 * Compact inline stepper. It deliberately renders no bar of its own: the
 * employee screens are single-viewport layouts, so this sits beside the page
 * title instead of occupying its own row.
 */
export function ProgressIndicator({ current, t }: { current: number; t: Translator }) {
  return (
    <div className="flex shrink-0 items-center gap-2" aria-label={t('progress.step', { current, total: STEPS.length })}>
      {STEPS.map((key, index) => {
        const step = index + 1
        const done = step < current
        const active = step === current
        return (
          <div className="flex items-center gap-2" key={key}>
            <div className="flex items-center gap-1.5">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-brand-dark text-white'
                    : active
                      ? 'bg-brand-soft text-brand-dark ring-2 ring-brand'
                      : 'bg-surface text-muted ring-1 ring-line'
                }`}
              >
                {done ? <Icon name="check" size={14} /> : step}
              </span>
              <span
                className={`hidden text-xs font-bold xl:block ${
                  active ? 'text-ink' : done ? 'text-brand-dark' : 'text-muted'
                }`}
              >
                {t(key)}
              </span>
            </div>
            {step < STEPS.length && (
              <span aria-hidden="true" className={`h-0.5 w-6 rounded-full ${done ? 'bg-brand' : 'bg-line'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
