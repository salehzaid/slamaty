import React from 'react'

type StatusMap = {
  [key: string]: { ar: string; en: string }
}

const STATUS_MAP: StatusMap = {
  scheduled: { ar: 'مجدولة', en: 'SCHEDULED' },
  in_progress: { ar: 'قيد التنفيذ', en: 'IN_PROGRESS' },
  pending_review: { ar: 'بانتظار المراجعة', en: 'PENDING_REVIEW' },
  under_review: { ar: 'تحت المراجعة', en: 'UNDER_REVIEW' },
  completed: { ar: 'مكتملة', en: 'COMPLETED' },
  cancelled: { ar: 'ملغاة', en: 'CANCELLED' },
  on_hold: { ar: 'معلقة', en: 'ON_HOLD' },
  overdue: { ar: 'متأخرة', en: 'OVERDUE' },
  pending: { ar: 'معلق', en: 'PENDING' }
}

export function getStatusAr(status?: string) {
  if (!status) return ''
  const key = String(status).toLowerCase()
  return STATUS_MAP[key]?.ar || status
}

export function getStatusEn(status?: string) {
  if (!status) return ''
  const key = String(status).toLowerCase()
  return STATUS_MAP[key]?.en || String(status).toUpperCase()
}

export function renderStatusLabel(status?: string) {
  const ar = getStatusAr(status)
  const en = getStatusEn(status)
  return (
    <span className="inline-flex items-center gap-2" aria-hidden={false}>
      <span>{ar}</span>
      {en && <span className="text-xs text-gray-400 font-mono" aria-hidden>{en}</span>}
    </span>
  )
}

export default STATUS_MAP

