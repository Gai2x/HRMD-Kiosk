import { getRequestType } from '../data/requestTypes'
import { ALL_STATUSES, type HrmdRequest, type ServiceId } from './types'

export const FILTERS = [
  'All',
  ...ALL_STATUSES,
  'Certificate of Employment',
  'Service Record',
  'Leave requests',
  'Loan requests',
  'Others',
]

export function matchesFilter(item: HrmdRequest, filter: string) {
  if (filter === 'All') return true
  if (filter === 'Leave requests') return getRequestType(item.service).category === 'leave'
  if (filter === 'Loan requests') return getRequestType(item.service).category === 'loan'
  if (filter === 'Certificate of Employment') return item.service === 'coe'
  if (filter === 'Service Record') return item.service === 'service_record'
  if (filter === 'Others') return item.service === 'others'
  return item.status === filter
}

export function serviceLabel(service: ServiceId): string {
  if (service === 'coe') return 'Certificate of Employment'
  if (service === 'service_record') return 'Service Record'
  if (service === 'leave_review') return 'Leave Credit Review'
  if (service === 'leave_balance') return 'Available Leave Balance Request'
  if (service === 'loan') return 'Loan Request'
  if (service === 'others') return 'Others'
  return service
}

/** Translation key for the chosen category of a request, if any. */
export function getOptionKey(service: ServiceId, optionId: string | undefined): string | undefined {
  if (!optionId) return undefined
  if (service === 'coe' && optionId === 'coe') return 'details.option.coe'
  if (service === 'service_record' && optionId === 'service_record') return 'details.option.service_record'
  if (service === 'leave_review') {
    if (optionId === 'vacation') return 'details.option.vacation'
    if (optionId === 'sick') return 'details.option.sick'
    if (optionId === 'both') return 'details.option.both'
    if (optionId === 'general') return 'details.option.general'
  }
  if (service === 'leave_balance') {
    if (optionId === 'vacation_balance') return 'details.option.vacation_balance'
    if (optionId === 'sick_balance') return 'details.option.sick_balance'
    if (optionId === 'both_balances') return 'details.option.both_balances'
    if (optionId === 'other_balance') return 'details.option.other_balance'
  }
  if (service === 'loan') {
    if (optionId === 'gsis') return 'details.option.gsis'
    if (optionId === 'landbank') return 'details.option.landbank'
    if (optionId === 'other_loan') return 'details.option.other_loan'
  }
  if (service === 'others') {
    if (optionId === 'ob_request') return 'details.option.ob_request'
    if (optionId === 'contracts') return 'details.option.contracts'
    if (optionId === 'dtr_request') return 'details.option.dtr_request'
    if (optionId === 'others_specify') return 'details.option.others_specify'
  }
  return undefined
}

export function formatRate(rate: number | null | undefined) {
  if (rate === null || rate === undefined) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(rate)
}
