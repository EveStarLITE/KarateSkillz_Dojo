/** Hourly slots offered for private lessons (24h HH:mm). */
const PRIVATE_LESSON_SLOT_TIMES = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

function normalizePreferredTime(t) {
  if (t == null || t === '') return null
  const s = String(t).trim()
  const m = s.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/** @param {string} dateStr YYYY-MM-DD */
function dateInMonth(dateStr, monthPrefix) {
  return typeof dateStr === 'string' && dateStr.startsWith(monthPrefix)
}

/**
 * Scan completed/pending orders for private lesson line items (service id 4).
 * @returns {{ date: string, time: string }[]}
 */
function collectPrivateLessonBookings(orders) {
  const keys = new Set()
  for (const order of orders) {
    for (const item of order.items || []) {
      if (item.type !== 'service' || String(item.id) !== '4') continue
      const d = item.options?.preferredDate
      const t = normalizePreferredTime(item.options?.preferredTime)
      if (!d || !t) continue
      keys.add(`${d}|${t}`)
    }
  }
  return [...keys].map((key) => {
    const [date, time] = key.split('|')
    return { date, time }
  })
}

module.exports = {
  PRIVATE_LESSON_SLOT_TIMES,
  normalizePreferredTime,
  dateInMonth,
  collectPrivateLessonBookings,
}
