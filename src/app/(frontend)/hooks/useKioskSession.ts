'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EmployeeInfo, HrmdRequest, ServiceId } from '../lib/types'

/** 0 welcome · 1 selection · 2 employee · 3 details · 4 review · 5 receipt */
export type SessionStep = 0 | 1 | 2 | 3 | 4 | 5

export type DetailsState = {
  optionId: string
  purpose: string
  copies: string
  remarks: string
  othersSpecified: string
}

export const EMPTY_EMPLOYEE: EmployeeInfo = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  position: '',
  office: '',
  employmentStatus: '',
  email: '',
  contact: '',
}

export const EMPTY_DETAILS: DetailsState = {
  optionId: '',
  purpose: '',
  copies: '1',
  remarks: '',
  othersSpecified: '',
}

/**
 * Owns everything the kiosk remembers about one employee's visit.
 * Clearing the session is a single call, which is what the cancel button,
 * the Done button, the success timeout and the inactivity timeout all use.
 */
export function useKioskSession() {
  const [step, setStep] = useState<SessionStep>(0)
  const [serviceId, setServiceId] = useState<ServiceId | null>(null)
  const [employee, setEmployee] = useState<EmployeeInfo>(EMPTY_EMPLOYEE)
  const [details, setDetails] = useState<DetailsState>(EMPTY_DETAILS)
  const [receipt, setReceipt] = useState<HrmdRequest | null>(null)

  const reset = useCallback(() => {
    setStep(0)
    setServiceId(null)
    setEmployee(EMPTY_EMPLOYEE)
    setDetails(EMPTY_DETAILS)
    setReceipt(null)
  }, [])

  const start = useCallback(() => setStep(1), [])

  const selectService = useCallback((id: ServiceId) => {
    setServiceId(id)
    setDetails(EMPTY_DETAILS)
    setStep(2)
  }, [])

  const patchEmployee = useCallback((patch: Partial<EmployeeInfo>) => {
    setEmployee((current) => ({ ...current, ...patch }))
  }, [])

  const patchDetails = useCallback((patch: Partial<DetailsState>) => {
    setDetails((current) => ({ ...current, ...patch }))
  }, [])

  const goTo = useCallback((next: SessionStep) => setStep(next), [])

  const back = useCallback(() => {
    setStep((current) => (current > 0 ? ((current - 1) as SessionStep) : 0))
  }, [])

  const complete = useCallback((request: HrmdRequest) => {
    setReceipt(request)
    setStep(5)
  }, [])

  return useMemo(
    () => ({
      step,
      serviceId,
      employee,
      details,
      receipt,
      reset,
      start,
      back,
      goTo,
      selectService,
      patchEmployee,
      patchDetails,
      complete,
    }),
    [
      step,
      serviceId,
      employee,
      details,
      receipt,
      reset,
      start,
      back,
      goTo,
      selectService,
      patchEmployee,
      patchDetails,
      complete,
    ],
  )
}
