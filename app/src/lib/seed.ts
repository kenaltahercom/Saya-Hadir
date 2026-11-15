import type { Account, Attendance, DB, Employee } from './types'
import { addDays, jakartaMs, toMinutes, zoned } from './time'

export async function sha256(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Browser ini tidak mendukung enkripsi kata sandi (butuh HTTPS atau localhost).')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const DEMO_PASSWORD = 'demo1234'
export const DEMO_COMPANY_ID = 'demo'
export const DEMO_LOGINS = {
  karyawan: { label: 'Karyawan (Andi)', email: 'andi@perusahaan.com' },
  hr: { label: 'HR (Siti)', email: 'siti@perusahaan.com' },
  owner: { label: 'Owner (Budi)', email: 'admin@sayahadir.com' },
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

const EMPLOYEES: Omit<Employee, 'photo'>[] = [
  { id: 'e1', nip: 'SH-2024-001', name: 'Rian Pratama', email: 'rian@perusahaan.com', department: 'Engineering', position: 'Lead Developer', status: 'active', joined: '2024-01-12', scheduleId: 'SCH-01' },
  { id: 'e2', nip: 'SH-2024-002', name: 'Siti Rahmawati', email: 'siti@perusahaan.com', department: 'Human Resources', position: 'HR Officer', status: 'active', joined: '2024-02-15', scheduleId: 'SCH-01' },
  { id: 'e3', nip: 'SH-2024-003', name: 'Dimas Setiawan', email: 'dimas@perusahaan.com', department: 'Finance', position: 'Staff Finance', status: 'active', joined: '2024-03-01', scheduleId: 'SCH-01' },
  { id: 'e4', nip: 'SH-2024-004', name: 'Andi Pratama', email: 'andi@perusahaan.com', department: 'Engineering', position: 'Frontend Engineer', status: 'active', joined: '2024-04-10', scheduleId: 'SCH-02' },
  { id: 'e5', nip: 'SH-2024-005', name: 'Dewi Lestari', email: 'dewi@perusahaan.com', department: 'Marketing', position: 'Growth Specialist', status: 'active', joined: '2024-05-20', scheduleId: 'SCH-01' },
  { id: 'e6', nip: 'SH-2024-006', name: 'Bambang Sudiro', email: 'bambang@perusahaan.com', department: 'Operations', position: 'Operations Supervisor', status: 'active', joined: '2024-06-01', scheduleId: 'SCH-02' },
  { id: 'e7', nip: 'SH-2024-007', name: 'Maya Anggraini', email: 'maya@perusahaan.com', department: 'Marketing', position: 'Content Strategist', status: 'inactive', joined: '2024-07-15', scheduleId: 'SCH-01' },
]

export async function buildDemo(nowMs: number): Promise<{ db: DB; accounts: Account[] }> {
  const tz = 'Asia/Jakarta'
  const today = zoned(nowMs, tz)
  const schedules = [
    { id: 'SCH-01', name: 'Reguler kantor', days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00', tolerance: 15, isDefault: true },
    { id: 'SCH-02', name: 'Shift operasional', days: [1, 2, 3, 4, 5, 6], start: '07:00', end: '15:00', tolerance: 10, isDefault: false },
  ]
  const attendance: Attendance[] = []
  const active = EMPLOYEES.filter((e) => e.status === 'active')

  for (let back = 35; back >= 0; back--) {
    const date = addDays(today.date, -back)
    const dow = zoned(jakartaMs(date, '12:00'), tz).dow
    active.forEach((emp, idx) => {
      const sch = schedules.find((s) => s.id === emp.scheduleId)!
      if (!sch.days.includes(dow) || date < emp.joined) return
      const r = rng(idx * 1000 + Number(date.replaceAll('-', '')))
      const roll = r()
      const start = toMinutes(sch.start)
      const end = toMinutes(sch.end)
      const isToday = back === 0
      // Andi adalah akun demo karyawan: hari ini dibiarkan kosong supaya alur absen bisa dicoba.
      if (isToday && emp.id === 'e4') return

      if (!isToday && roll >= 0.93) {
        attendance.push({ id: `${emp.id}_${date}`, employeeId: emp.id, date, status: roll < 0.965 ? 'leave' : 'absent', lateMinutes: 0 })
        return
      }
      const late = roll >= 0.78
      const inMin = late ? start + sch.tolerance + 1 + Math.floor(r() * 24) : start - 18 + Math.floor(r() * (sch.tolerance + 14))
      const inAt = jakartaMs(date, hhmm(inMin))
      if (isToday && inAt > nowMs) return
      const outMin = end - 4 + Math.floor(r() * 32)
      const outAt = jakartaMs(date, hhmm(outMin))
      const rec: Attendance = {
        id: `${emp.id}_${date}`,
        employeeId: emp.id,
        date,
        inAt,
        status: late ? 'late' : 'ontime',
        lateMinutes: late ? inMin - start : 0,
        distanceIn: 8 + Math.floor(r() * 100),
        accuracyIn: 6 + Math.floor(r() * 40),
      }
      if (!isToday || outAt <= nowMs) {
        rec.outAt = outAt
        rec.distanceOut = 8 + Math.floor(r() * 100)
      }
      attendance.push(rec)
    })
  }

  // Satu contoh koreksi manual supaya log audit tidak kosong pada data demo.
  const corrected = attendance.filter((a) => a.employeeId === 'e3' && a.status === 'late' && a.date < today.date).at(-1)
  const audit: DB['audit'] = []
  if (corrected) {
    corrected.status = 'ontime'
    corrected.lateMinutes = 0
    const at = jakartaMs(addDays(corrected.date, 1), '09:20')
    corrected.correction = { by: 'Budi Santoso (Owner)', at, reason: 'Sensor GPS perangkat bermasalah, hadir tepat waktu menurut atasan.' }
    audit.push({
      id: 'aud-demo-1',
      at,
      actor: 'Budi Santoso (Owner)',
      action: 'Koreksi absensi',
      target: `Dimas Setiawan · ${corrected.date}`,
      detail: 'Status Terlambat → Tepat waktu. Alasan: sensor GPS perangkat bermasalah.',
    })
  }

  const db: DB = {
    company: { id: DEMO_COMPANY_ID, name: 'PT Maju Bersama Solusindo', industry: 'Teknologi & layanan digital', timezone: tz, requireSelfie: false },
    office: {
      name: 'Kantor Pusat Kuningan',
      address: 'Gedung Cyber 2 Lt. 14, Jl. H.R. Rasuna Said, Jakarta Selatan',
      lat: -6.2255,
      lng: 106.8315,
      radius: 150,
      maxAccuracy: 100,
    },
    schedules,
    employees: EMPLOYEES,
    attendance,
    audit,
  }

  const hash = await sha256(DEMO_PASSWORD)
  const accounts: Account[] = [
    { id: 'acc-owner', email: 'admin@sayahadir.com', hash, name: 'Budi Santoso', role: 'owner', companyId: DEMO_COMPANY_ID },
    { id: 'acc-hr', email: 'siti@perusahaan.com', hash, name: 'Siti Rahmawati', role: 'hr', companyId: DEMO_COMPANY_ID, employeeId: 'e2' },
    { id: 'acc-andi', email: 'andi@perusahaan.com', hash, name: 'Andi Pratama', role: 'karyawan', companyId: DEMO_COMPANY_ID, employeeId: 'e4' },
  ]
  return { db, accounts }
}
