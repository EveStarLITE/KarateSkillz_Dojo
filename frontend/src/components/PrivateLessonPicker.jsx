import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FALLBACK_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatMonthLabel(d) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function formatDisplayDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return 'Not selected'
  const dt = parseYmd(dateStr)
  const [h, min] = timeStr.split(':').map(Number)
  dt.setHours(h, min, 0, 0)
  return dt.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function PrivateLessonPicker({ preferredDate, preferredTime, onChange }) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [slotTimes, setSlotTimes] = useState(FALLBACK_SLOTS)
  const [booked, setBooked] = useState([])
  const [loading, setLoading] = useState(false)
  const [pickDate, setPickDate] = useState('')
  const [pickTime, setPickTime] = useState('')

  const monthKey = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch(`/availability/private-lessons?month=${monthKey}`)
      setSlotTimes(Array.isArray(data.slotTimes) && data.slotTimes.length ? data.slotTimes : FALLBACK_SLOTS)
      setBooked(Array.isArray(data.booked) ? data.booked : [])
    } catch {
      setSlotTimes(FALLBACK_SLOTS)
      setBooked([])
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    if (pickDate && !pickDate.startsWith(monthKey)) {
      setPickDate('')
      setPickTime('')
    }
  }, [monthKey, open, pickDate])

  const bookedSet = useMemo(() => new Set(booked.map((b) => `${b.date}|${b.time}`)), [booked])

  const todayYmd = useMemo(() => toYmd(new Date()), [])

  const daysGrid = useMemo(() => {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startPad = first.getDay()
    const daysInMonth = last.getDate()
    const cells = []
    for (let i = 0; i < startPad; i += 1) cells.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(y, m, d))
    return cells
  }, [cursor])

  function isDayFullyBooked(ymd) {
    if (!slotTimes.length) return false
    return slotTimes.every((t) => bookedSet.has(`${ymd}|${t}`))
  }

  function isPastDay(ymd) {
    return ymd < todayYmd
  }

  function slotDisabled(ymd, t) {
    return bookedSet.has(`${ymd}|${t}`)
  }

  function confirmSelection() {
    if (pickDate && pickTime) {
      onChange({ preferredDate: pickDate, preferredTime: pickTime })
      setOpen(false)
    }
  }

  function openModal() {
    setPickDate(preferredDate || '')
    setPickTime(preferredTime || '')
    if (preferredDate) {
      const [y, m] = preferredDate.split('-').map(Number)
      if (y && m) setCursor(new Date(y, m - 1, 1))
    }
    setOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full rounded border border-dojo-red/50 bg-dojo-ink px-4 py-3 text-left text-white transition hover:border-dojo-crimson hover:bg-dojo-black/40"
          onClick={openModal}
        >
          <span className="text-sm text-gray-400">Preferred appointment</span>
          <div className="mt-1 font-medium">{formatDisplayDateTime(preferredDate, preferredTime)}</div>
          <span className="mt-2 text-sm text-dojo-crimson underline">Open calendar</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-lesson-picker-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-white/20 bg-dojo-ink p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="private-lesson-picker-title" className="font-serif text-xl font-semibold">
              Choose date &amp; time
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Booked slots are unavailable. Days with no open times are greyed out.
            </p>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                Prev
              </button>
              <span className="font-medium">{formatMonthLabel(cursor)}</span>
              <button
                type="button"
                className="rounded border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                Next
              </button>
            </div>

            {loading && <p className="mt-3 text-sm text-gray-400">Loading availability…</p>}

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 font-semibold">
                  {w}
                </div>
              ))}
              {daysGrid.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />
                const ymd = toYmd(day)
                const past = isPastDay(ymd)
                const full = !past && isDayFullyBooked(ymd)
                const selected = ymd === pickDate
                const disabled = past || full
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={disabled}
                    title={
                      past ? 'Past date' : full ? 'No open slots this day' : `Select ${ymd}`
                    }
                    className={`rounded py-2 text-sm font-medium transition ${
                      disabled
                        ? 'cursor-not-allowed bg-dojo-black/30 text-gray-600 line-through'
                        : selected
                          ? 'bg-dojo-crimson text-white'
                          : 'bg-dojo-black/40 text-white hover:bg-dojo-red/40'
                    }`}
                    onClick={() => {
                      setPickDate(ymd)
                      setPickTime('')
                    }}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>

            {pickDate && !loading && slotTimes.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-300">Time on {pickDate}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {slotTimes.map((t) => {
                    const taken = slotDisabled(pickDate, t)
                    const sel = t === pickTime
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={taken}
                        title={taken ? 'Already booked' : `Select ${t}`}
                        className={`rounded border px-2 py-2 text-sm ${
                          taken
                            ? 'cursor-not-allowed border-white/10 bg-dojo-black/20 text-gray-600 line-through'
                            : sel
                              ? 'border-dojo-crimson bg-dojo-crimson/30 text-white'
                              : 'border-white/20 hover:border-dojo-crimson/60'
                        }`}
                        onClick={() => setPickTime(t)}
                      >
                        {(() => {
                          const [h, m] = t.split(':').map(Number)
                          const d = new Date(2000, 0, 1, h, m)
                          return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                        })()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                className="rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pickDate || !pickTime}
                className="rounded bg-dojo-red px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                onClick={confirmSelection}
              >
                Use this slot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
