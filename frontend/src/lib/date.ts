export function parseDateish(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value

  const raw = String(value).trim()
  if (!raw) return null

  // ISO / RFC
  const iso = new Date(raw)
  if (!isNaN(iso.getTime())) return iso

  // DD/MM/YYYY (or D/M/YYYY)
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const dd = Number(m[1])
    const mm = Number(m[2])
    const yyyy = Number(m[3])
    const d = new Date(yyyy, mm - 1, dd)
    if (!isNaN(d.getTime())) return d
  }

  return null
}

export function formatDDMMYYYY(date: Date | string | null): string {
  const d = date instanceof Date ? date : parseDateish(date)
  if (!d) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}/${mm}/${yyyy}`
}

