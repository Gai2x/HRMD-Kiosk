'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../../lib/api-client'

/**
 * Client view of the staff session.
 *
 * No credential lives here any more: signing in posts to /api/auth/login, the
 * server checks the scrypt hash in the `staff` table and sets an httpOnly
 * session cookie. This provider only mirrors "/api/auth/me" for the UI.
 */

export type StaffRole = 'admin' | 'hr_staff'

export type StaffSession = {
  id: number
  username: string
  displayName: string
  role: StaffRole
}

export type SignInResult = { ok: true } | { ok: false; error: string }

type SessionStatus = 'loading' | 'signed-in' | 'signed-out'

type AdminSessionValue = {
  status: SessionStatus
  staff: StaffSession | null
  signIn: (username: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [staff, setStaff] = useState<StaffSession | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const result = await apiFetch<StaffSession>('/api/auth/me')
      if (cancelled) return
      if (result.ok) {
        setStaff(result.data)
        setStatus('signed-in')
      } else {
        setStaff(null)
        setStatus('signed-out')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (username: string, password: string): Promise<SignInResult> => {
    if (!username.trim() || !password) {
      return { ok: false, error: 'Please enter both username and password.' }
    }

    const result = await apiFetch<StaffSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    if (!result.ok) {
      if (result.status === 503) {
        return { ok: false, error: 'The staff database is not reachable right now.' }
      }
      return { ok: false, error: result.message ?? 'Invalid username or password.' }
    }

    setStaff(result.data)
    setStatus('signed-in')
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    await apiFetch<{ signedOut: boolean }>('/api/auth/logout', { method: 'POST' })
    setStaff(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo(() => ({ status, staff, signIn, signOut }), [status, staff, signIn, signOut])

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) throw new Error('useAdminSession must be used inside <AdminSessionProvider>')
  return context
}

/** Convenience for screens that only need the display identity. */
export function useStaffIdentity() {
  const { staff } = useAdminSession()
  return {
    adminName: staff?.displayName ?? 'HRMD staff',
    adminRole: staff?.role === 'admin' ? 'HRMD Administrator' : 'HRMD Staff',
  }
}
