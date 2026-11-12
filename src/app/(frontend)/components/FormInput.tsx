'use client'

import type { Ref } from 'react'
import { Icon } from './Icons'

type FieldChrome = {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
}

function Label({ id, label, required, optionalLabel = true }: FieldChrome & { optionalLabel?: boolean }) {
  return (
    <label className="mb-2 flex items-baseline gap-1.5 text-sm font-bold text-ink" htmlFor={id}>
      {label}
      {required ? (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      ) : (
        optionalLabel && <span className="text-xs font-medium text-muted">(optional)</span>
      )}
    </label>
  )
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold leading-snug text-danger" id={`${id}-error`}>
        <Icon className="shrink-0" name="warning" size={13} />
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p className="mt-1 text-xs text-muted" id={`${id}-hint`}>
        {hint}
      </p>
    )
  }
  return null
}

export function FormInput({
  id,
  label,
  required,
  error,
  hint,
  value,
  placeholder,
  type = 'text',
  inputMode,
  onChange,
  onBlur,
  inputRef,
  maxLength,
  autoComplete = 'off',
  textTransform,
  optionalLabel,
}: FieldChrome & {
  value: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel'
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  onChange: (value: string) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  maxLength?: number
  autoComplete?: string
  textTransform?: 'uppercase'
  optionalLabel?: boolean
}) {
  return (
    <div className="min-w-0">
      <Label id={id} label={label} optionalLabel={optionalLabel} required={required} />
      <input
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        autoComplete={autoComplete}
        className={`field-input ${textTransform === 'uppercase' ? 'uppercase' : ''}`}
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={inputRef}
        type={type}
        value={value}
      />
      <FieldMessage error={error} hint={hint} id={id} />
    </div>
  )
}

export function FormTextArea({
  id,
  label,
  required,
  error,
  hint,
  value,
  placeholder,
  onChange,
  onBlur,
  textareaRef,
  rows = 3,
  optionalLabel = true,
}: FieldChrome & {
  value: string
  placeholder?: string
  onChange: (value: string) => void
  onBlur?: () => void
  textareaRef?: Ref<HTMLTextAreaElement>
  rows?: number
  optionalLabel?: boolean
}) {
  return (
    <div className="min-w-0">
      <Label id={id} label={label} optionalLabel={optionalLabel} required={required} />
      <textarea
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className="field-input min-h-32 resize-y py-3 leading-relaxed"
        id={id}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={textareaRef}
        rows={rows}
        value={value}
      />
      <FieldMessage error={error} hint={hint} id={id} />
    </div>
  )
}

export function FormSelect({
  id,
  label,
  required,
  error,
  hint,
  value,
  placeholder,
  options,
  onChange,
  onBlur,
  selectRef,
}: FieldChrome & {
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (value: string) => void
  onBlur?: () => void
  selectRef?: Ref<HTMLSelectElement>
}) {
  return (
    <div className="min-w-0">
      <Label id={id} label={label} required={required} />
      <div className="relative">
        <select
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          className="field-input appearance-none pr-12"
          id={id}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          ref={selectRef}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          name="chevronDown"
          size={20}
        />
      </div>
      <FieldMessage error={error} hint={hint} id={id} />
    </div>
  )
}

/**
 * Shared chrome for grouped controls (radio-style buttons). Keeps the visible
 * required marker, the group label, and the error message in one place.
 */
export function FieldGroup({
  label,
  required,
  error,
  errorId,
  describedBy,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  errorId: string
  describedBy?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <span className="mb-2 flex items-baseline gap-1.5 text-sm font-bold text-ink" id={`${errorId}-label`}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        )}
      </span>
      <div aria-describedby={describedBy ?? (error ? errorId : undefined)} className="grid gap-2 sm:grid-cols-2">
        {children}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold leading-snug text-danger" id={errorId}>
          <Icon className="shrink-0" name="warning" size={13} />
          {error}
        </p>
      )}
    </div>
  )
}
