'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const IDLE_MS = 45_000
const WARNING_MS = 10_000
const TICK_MS = 250

/**
 * Shared-kiosk privacy timer.
 *
 * After 35s of no interaction the warning appears and a 10s countdown runs;
 * at 45s the session is cleared. Activity restarts the idle window only while
 * the warning is hidden, so a stray touch cannot silently keep an abandoned
 * session (and the previous employee's data) alive on screen.
 */
export function useInactivityTimer({
  enabled,
  onTimeout,
}: {
  enabled: boolean
  onTimeout: () => void
}) {
  const [warning, setWarning] = useState(false)
  const [seconds, setSeconds] = useState(WARNING_MS / 1000)

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const deadline = useRef(0)
  const warningRef = useRef(false)
  const timeoutRef = useRef(onTimeout)

  timeoutRef.current = onTimeout

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (tickTimer.current) clearInterval(tickTimer.current)
    idleTimer.current = null
    tickTimer.current = null
  }, [])

  const startWarning = useCallback(() => {
    clearTimers()
    warningRef.current = true
    setWarning(true)
    deadline.current = Date.now() + WARNING_MS
    setSeconds(WARNING_MS / 1000)

    tickTimer.current = setInterval(() => {
      const remaining = deadline.current - Date.now()
      if (remaining <= 0) {
        clearTimers()
        warningRef.current = false
        setWarning(false)
        timeoutRef.current()
        return
      }
      setSeconds(Math.ceil(remaining / 1000))
    }, TICK_MS)
  }, [clearTimers])

  const restart = useCallback(() => {
    clearTimers()
    warningRef.current = false
    setWarning(false)
    setSeconds(WARNING_MS / 1000)
    if (!enabled) return
    idleTimer.current = setTimeout(startWarning, IDLE_MS - WARNING_MS)
  }, [clearTimers, enabled, startWarning])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      warningRef.current = false
      setWarning(false)
      return
    }

    restart()

    const onActivity = () => {
      if (warningRef.current) return
      restart()
    }

    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)

    return () => {
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      clearTimers()
    }
  }, [enabled, restart, clearTimers])

  /** "Continue Session" — dismisses the warning and restarts the window. */
  const stay = useCallback(() => {
    restart()
  }, [restart])

  return { warning, seconds, stay, restart }
}
