import type { Translator } from '../data/translations'
import { Icon } from './Icons'

/**
 * LGU Tanjay City / HRMD lockup. Uses the project's existing emblem treatment
 * (an initials roundel) so no external brand asset is required.
 * When logoImage is provided, shows the image instead of the LGU roundel.
 */
export function Brand({
  t,
  inverse = false,
  compact = false,
  showDivision = true,
  logoImage,
}: {
  t: Translator
  inverse?: boolean
  compact?: boolean
  showDivision?: boolean
  logoImage?: string
}) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${inverse ? 'text-white' : 'text-ink'}`}>
      {logoImage ? (
        <img
          alt="LGU Tanjay City HRMD"
          className={`shrink-0 ${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-contain border-2 ${
            inverse
              ? 'border-white/40 bg-white/10 p-1'
              : 'border-brand/40 bg-brand-soft p-1'
          }`}
          src={logoImage}
        />
      ) : (
        <div
          className={`grid ${compact ? 'size-11' : 'size-14'} shrink-0 place-items-center rounded-full border-2 font-display font-bold ${
            inverse ? 'border-white/40 bg-white/10' : 'border-brand/40 bg-brand-soft text-brand-dark'
          }`}
        >
          <span className={compact ? 'text-xs' : 'text-sm'}>LGU</span>
        </div>
      )}
      <div className="min-w-0">
        <p
          className={`${compact ? 'text-[10px]' : 'text-xs'} truncate font-bold uppercase tracking-[0.2em] ${
            inverse ? 'text-white/70' : 'text-brand-dark'
          }`}
        >
          {t('brand.lgu')}
        </p>
        {showDivision && (
          <p
            className={`${compact ? 'text-sm' : 'text-base'} truncate font-bold leading-tight`}
            title={t('brand.dept')}
          >
            {t('brand.dept')}
          </p>
        )}
      </div>
    </div>
  )
}

/** Small "this is a prototype" pill, shown so nobody mistakes the demo for live. */
export function PrototypeNotice({
  t,
  dark = false,
}: {
  t: Translator
  dark?: boolean
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        dark ? 'bg-white/10 text-white/80' : 'bg-brand-soft text-brand-dark'
      }`}
    >
      <Icon name="sparkles" size={14} />
      {t('brand.prototype')}
    </div>
  )
}
