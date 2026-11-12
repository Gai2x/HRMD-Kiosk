import type { IconName } from '../components/Icons'
import type { ServiceCategory } from '../lib/types'
import type { TranslationKey } from './translations'

// Keep a project-local union so the approved Figma integration can import a
// concrete `ServiceId` without reaching into the shared lib types.
export type ServiceId = 'coe' | 'service_record' | 'leave_review' | 'leave_balance' | 'loan' | 'others'

export type RequestOption = { id: string; labelKey: TranslationKey }

export type RequestTypeConfig = {
  id: ServiceId
  labelKey: TranslationKey
  descKey: TranslationKey
  icon: IconName
  category: ServiceCategory
  /** Categories the employee chooses from on the details screen. */
  options: RequestOption[]
  optionLabelKey: TranslationKey
  /** Printed documents ask for a copy count. */
  needsCopies: boolean
  /** Document / leave / loan requests all collect optional remarks except documents. */
  needsRemarks: boolean
  /** Restrictive notice shown above the details form. */
  noticeKey?: TranslationKey
}

export const REQUEST_TYPES: RequestTypeConfig[] = [
  {
    id: 'coe',
    labelKey: 'service.coe.label',
    descKey: 'service.coe.desc',
    icon: 'document',
    category: 'document',
    options: [{ id: 'coe', labelKey: 'details.option.coe' }],
    optionLabelKey: 'details.docType',
    needsCopies: true,
    needsRemarks: false,
  },
  {
    id: 'service_record',
    labelKey: 'service.service_record.label',
    descKey: 'service.service_record.desc',
    icon: 'files',
    category: 'document',
    options: [{ id: 'service_record', labelKey: 'details.option.service_record' }],
    optionLabelKey: 'details.docType',
    needsCopies: true,
    needsRemarks: false,
  },
  {
    id: 'leave_review',
    labelKey: 'service.leave_review.label',
    descKey: 'service.leave_review.desc',
    icon: 'clipboardCheck',
    category: 'leave',
    options: [
      { id: 'vacation', labelKey: 'details.option.vacation' },
      { id: 'sick', labelKey: 'details.option.sick' },
      { id: 'both', labelKey: 'details.option.both' },
      { id: 'general', labelKey: 'details.option.general' },
    ],
    optionLabelKey: 'details.leaveCategory',
    needsCopies: false,
    needsRemarks: true,
    noticeKey: 'details.notice.leave',
  },
  {
    id: 'leave_balance',
    labelKey: 'service.leave_balance.label',
    descKey: 'service.leave_balance.desc',
    icon: 'calendarDays',
    category: 'leave',
    options: [
      { id: 'vacation_balance', labelKey: 'details.option.vacation_balance' },
      { id: 'sick_balance', labelKey: 'details.option.sick_balance' },
      { id: 'both_balances', labelKey: 'details.option.both_balances' },
      { id: 'other_balance', labelKey: 'details.option.other_balance' },
    ],
    optionLabelKey: 'details.balanceType',
    needsCopies: false,
    needsRemarks: true,
    noticeKey: 'details.notice.leave',
  },
  {
    id: 'loan',
    labelKey: 'service.loan.label',
    descKey: 'service.loan.desc',
    icon: 'landmark',
    category: 'loan',
    options: [
      { id: 'gsis', labelKey: 'details.option.gsis' },
      { id: 'landbank', labelKey: 'details.option.landbank' },
      { id: 'other_loan', labelKey: 'details.option.other_loan' },
    ],
    optionLabelKey: 'details.loanCategory',
    needsCopies: false,
    needsRemarks: true,
    noticeKey: 'details.notice.loan',
  },
  {
    id: 'others',
    labelKey: 'service.others.label',
    descKey: 'service.others.desc',
    icon: 'helpCircle',
    category: 'other',
    options: [
      { id: 'ob_request', labelKey: 'details.option.ob_request' },
      { id: 'contracts', labelKey: 'details.option.contracts' },
      { id: 'dtr_request', labelKey: 'details.option.dtr_request' },
      { id: 'others_specify', labelKey: 'details.option.others_specify' },
    ],
    optionLabelKey: 'details.othersType',
    needsCopies: false,
    needsRemarks: true,
  },
]

const BY_ID = new Map(REQUEST_TYPES.map((type) => [type.id, type]))

export function getRequestType(id: ServiceId): RequestTypeConfig {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown request type: ${id}`)
  return found
}

export function getOptionLabelKey(
  service: ServiceId,
  optionId: string | undefined,
): TranslationKey | undefined {
  if (!optionId) return undefined
  return getRequestType(service).options.find((option) => option.id === optionId)?.labelKey
}
