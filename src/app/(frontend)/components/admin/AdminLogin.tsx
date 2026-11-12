'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icons'
import { FigmaNetworkBackground } from '../FigmaNetworkBackground'
import { useAdminSession } from './AdminSession'
import '../FigmaNetworkBackground.css'

export function AdminLogin() {
  const router = useRouter()
  const { signIn, status } = useAdminSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)

  // The middleware trusts only the cookie signature, so the authoritative
  // "already signed in" check happens here, against /api/auth/me.
  useEffect(() => {
    if (status === 'signed-in') {
      router.replace('/hrmd-admin')
      router.refresh()
    }
  }, [status, router])

  const submit = async () => {
    setBusy(true)
    setError('')
    const result = await signIn(username, password)
    if (!result.ok) {
      setBusy(false)
      setError(result.error)
      setPassword('')
      usernameRef.current?.focus()
      return
    }
    setUsername('')
    setPassword('')
    router.replace('/hrmd-admin')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#c2caf2] text-ink lg:flex">
        <FigmaNetworkBackground />

        <div className="relative z-10 flex flex-wrap items-center gap-3 px-8 pt-8">
          <div
            aria-label="Lungsod ng Tanjay city seal"
            className="size-16 shrink-0 overflow-hidden rounded-full shadow-lg ring-2 ring-white/70"
          >
            <img alt="" className="size-full object-contain" src="/Branding/tanjay-seal-cropped.png" />
          </div>
          <div
            aria-label="HRMD logo"
            className="size-16 shrink-0 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white/70"
          >
            <img alt="" className="size-full object-contain" height={64} src="/hr.jpg" width={64} />
          </div>
          <div className="flex min-w-0 flex-col leading-none text-ink">
            <span className="font-display text-xl font-black tracking-tight">HRMD</span>
            <span className="mt-0.5 font-display text-xs font-bold tracking-[0.2em] text-ink/75">
              LGU TANJAY CITY
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink">
            <Icon name="shield" size={12} />
            Admin
          </span>
        </div>

        <div className="relative z-10 max-w-xl px-8 pb-8">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink">
            Request monitoring,
            <br />
            made straightforward.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink/80">
            Monitor employee requests, keep the employee roster current, and update processing statuses from
            one workspace.
          </p>
        </div>

        <p className="relative z-10 border-t border-ink/10 px-8 py-4 text-sm text-ink/60">
          Authorized HRMD personnel only
        </p>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <p className="eyebrow">Secure staff access</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-2 text-muted">Sign in with your HRMD account to open the workspace.</p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">Username</span>
              <input
                autoComplete="username"
                className={`field-input ${error ? 'border-danger' : ''}`}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setError('')
                }}
                placeholder="Enter your username"
                ref={usernameRef}
                type="text"
                value={username}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">Password</span>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className={`field-input pr-24 ${error ? 'border-danger' : ''}`}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-dark"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && (
              <div aria-live="polite" className="flex items-center gap-2 text-sm font-semibold text-danger">
                <Icon name="warning" size={16} />
                {error}
              </div>
            )}

            <button className="btn btn-primary w-full" disabled={busy} type="submit">
              {busy ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  <Icon name="shield" size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="notice mt-6">
            <Icon className="mt-0.5 shrink-0" name="sparkles" size={19} />
            <span className="text-xs leading-relaxed">
              Accounts are managed in the HRMD staff table. Sessions expire after eight hours, and signing out
              revokes the session on the server.
            </span>
          </div>

          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink" href="/">
            <Icon name="arrowLeft" size={17} />
            Return to employee kiosk
          </Link>
        </div>
      </section>
    </main>
  )
}
