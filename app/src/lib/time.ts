export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_LONG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export interface Zoned {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  minutes: number
  dow: number // 0 = Minggu
}

/** Waktu dinding (wall clock) di zona waktu tertentu. */
export function zoned(ms: number, tz: string): Zoned {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour')}:${get('minute')}`
  return { date, time, minutes: toMinutes(time), dow: dowOf(date) }
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function dowOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function fmtDate(date: string, withDay = false): string {
  const [y, m, d] = date.split('-').map(Number)
  const base = `${d} ${MONTHS[m - 1]} ${y}`
  return withDay ? `${DAY_NAMES[dowOf(date)]}, ${base}` : base
}

export function fmtDateShort(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

export function fmtMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_LONG[m - 1]} ${y}`
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7)
}

export function fmtClock(ms: number | undefined, tz: string): string {
  if (!ms) return '–'
  return zoned(ms, tz).time
}

export function fmtDuration(fromMs?: number, toMs?: number): string {
  if (!fromMs || !toMs || toMs < fromMs) return '–'
  const mins = Math.round((toMs - fromMs) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h} j ${m} m` : `${m} m`
}

export function fmtDateTime(ms: number, tz: string): string {
  const z = zoned(ms, tz)
  return `${fmtDate(z.date)} ${z.time}`
}

export function greeting(minutes: number): string {
  if (minutes < 11 * 60) return 'Selamat pagi'
  if (minutes < 15 * 60) return 'Selamat siang'
  if (minutes < 18 * 60) return 'Selamat sore'
  return 'Selamat malam'
}

/** Epoch ms dari tanggal + jam dinding di Asia/Jakarta (UTC+7, tanpa DST). Dipakai untuk data demo. */
export function jakartaMs(date: string, hhmm: string): number {
  return Date.parse(`${date}T${hhmm}:00+07:00`)
}
