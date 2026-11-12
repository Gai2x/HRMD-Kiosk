/**
 * Domain model for the HRMD Employee Request Kiosk.
 *
 * Plain serialisable data only: everything here is what a future API would
 * send and receive, so the UI does not need reshaping when a backend arrives.
 */

export type Lang = 'en' | 'tl' | 'ce'

export type ServiceId = 'coe' | 'service_record' | 'leave_review' | 'leave_balance' | 'loan' | 'others'

export type ServiceCategory = 'document' | 'leave' | 'loan' | 'other'

export type RequestStatus =
  | 'Pending'
  | 'Under Review'
  | 'Response Sent via Email'
  | 'Completed'
  | 'Unable to Process'

/** Happy-path pipeline used by progress indicators. */
export const STATUS_FLOW: RequestStatus[] = [
  'Pending',
  'Under Review',
  'Response Sent via Email',
  'Completed',
]

export const ALL_STATUSES: RequestStatus[] = [...STATUS_FLOW, 'Unable to Process']

export const EMPLOYMENT_STATUSES = [
  'Permanent',
  'Casual',
  'Job Order',
  'Contract of Service (COS)',
] as const

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number]

export type EmployeeInfo = {
  /** Roster row this employee was picked from, when they were found in MySQL. */
  employeeId?: number | null
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  position: string
  office: string
  employmentStatus: EmploymentStatus | ''
  email: string
  contact: string
}

/* ------------------------------------------------------------------ roster */

export type EmployeeSource = 'seed' | 'import' | 'manual'

/** A row of the `employees` table, as returned by the API. */
export type EmployeeRecord = {
  id: number
  employeeNo: string | null
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  position: string
  office: string
  employmentStatus: EmploymentStatus | ''
  email: string
  contact: string
  salaryGrade: number | null
  rate: number | null
  source: EmployeeSource
  createdAt: string
  updatedAt: string
  /** How many requests this employee has filed (list endpoint only). */
  requestCount?: number
  lastRequestAt?: string | null
}

/** Fields the admin may change on a roster entry. */
export type EmployeePatch = Partial<
  Pick<
    EmployeeRecord,
    | 'employeeNo'
    | 'firstName'
    | 'middleName'
    | 'lastName'
    | 'suffix'
    | 'position'
    | 'office'
    | 'employmentStatus'
    | 'email'
    | 'contact'
    | 'salaryGrade'
    | 'rate'
  >
>

/* ---------------------------------------------------------------- activity */

export type ActivityAction =
  | 'sign_in'
  | 'sign_out'
  | 'request_status'
  | 'employee_create'
  | 'employee_update'

export type ActivityEntity = 'session' | 'request' | 'employee'

/** One row of the staff activity log (staff_activity). */
export type ActivityEntry = {
  id: number
  staffId: number | null
  staffName: string
  action: ActivityAction
  entity: ActivityEntity | null
  entityRef: string | null
  summary: string
  detail: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

/** One entry in a request's audit trail. Newest first in `HrmdRequest.history`. */
export type StatusEvent = {
  status: RequestStatus
  /** ISO timestamp with an explicit +08:00 offset. */
  at: string
  /** "Kiosk" for submissions, staff name for updates. */
  by: string
  note?: string
}

export type HrmdRequest = {
  /** Tracking reference, e.g. HR-2026-0007. */
  reference: string
  service: ServiceId
  /** Selected category id from the service configuration (leave type, loan type, …). */
  optionId?: string
  purpose: string
  copies?: number
  remarks?: string
  /** For Others service when "Others (Please Specify)" is selected. */
  othersSpecified?: string
  employee: EmployeeInfo
  submittedAt: string
  status: RequestStatus
  history: StatusEvent[]
}

/** What the kiosk hands to the store on submit. */
export type RequestDraft = Omit<HrmdRequest, 'reference' | 'submittedAt' | 'status' | 'history'>

/** Full display name: "Dela Cruz, Maria P. Jr." */
export function formatEmployeeName(employee: EmployeeInfo) {
  const given = [employee.firstName, employee.middleName].filter(Boolean).join(' ')
  const tail = [given, employee.suffix].filter(Boolean).join(' ')
  return [employee.lastName, tail].filter(Boolean).join(', ')
}

/** Initials for avatar chips: "MD". */
export function employeeInitials(employee: EmployeeInfo) {
  return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase() || '??'
}
