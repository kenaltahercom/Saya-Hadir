/**
 * Lapisan data lokal (localStorage). Semua halaman membaca/menulis lewat modul ini,
 * jadi saat pindah ke Supabase cukup mengganti isi file ini — UI tidak perlu diubah.
 *
 * Catatan batas: data tersimpan per-browser. Admin di desktop dan karyawan di ponsel
 * baru berbagi data setelah lapisan ini disambungkan ke backend.
 */
import { useSyncExternalStore } from 'react'
import type { Account, Attendance, AttStatus, Company, DB, Employee, Office, Role, Schedule } from './types'
import { buildDemo, DEMO_COMPANY_ID, sha256 } from './seed'
import { classify, evaluate, scheduleOf, type AttemptInput, type AttemptResult } from './attendance'
import { fmtDate, zoned } from './time'

const K_ACCOUNTS = 'sh.accounts'
const K_SESSION = 'sh.session'
const K_DB = (companyId: string) => `sh.db.${companyId}`

interface Snap {
  ready: boolean
  account: Account | null
  db: DB | null
  storageError: boolean
}

let snap: Snap = { ready: false, account: null, db: null, storageError: false }
const listeners = new Set<() => void>()

function emit(next: Partial<Snap>) {
  snap = { ...snap, ...next }
  listeners.forEach((l) => l())
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const accounts = (): Account[] => read<Account[]>(K_ACCOUNTS) ?? []
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`

function loadFromStorage() {
  const session = read<{ accountId: string }>(K_SESSION)
  const account = session ? (accounts().find((a) => a.id === session.accountId) ?? null) : null
  const db = account ? read<DB>(K_DB(account.companyId)) : null
  emit({ account: db ? account : null, db })
}

export async function bootstrap() {
  if (!read(K_ACCOUNTS)) {
    const demo = await buildDemo(Date.now())
    write(K_ACCOUNTS, demo.accounts)
    write(K_DB(DEMO_COMPANY_ID), demo.db)
  }
  loadFromStorage()
  emit({ ready: true })
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('sh.')) loadFromStorage()
  })
}

export function resetDemo() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('sh.'))
    .forEach((k) => localStorage.removeItem(k))
  window.location.assign('/login')
}

export function useStore(): Snap {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snap,
  )
}

/* ───────────── Auth ───────────── */

export async function login(email: string, password: string): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  const acc = accounts().find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  const hash = await sha256(password)
  if (!acc || acc.hash !== hash) return { ok: false, error: 'Email atau kata sandi tidak cocok.' }
  const db = read<DB>(K_DB(acc.companyId))
  if (!db) return { ok: false, error: 'Data perusahaan tidak ditemukan di perangkat ini.' }
  if (acc.employeeId && db.employees.find((e) => e.id === acc.employeeId)?.status === 'inactive') {
    return { ok: false, error: 'Akun Anda dinonaktifkan. Hubungi HR perusahaan.' }
  }
  write(K_SESSION, { accountId: acc.id })
  emit({ account: acc, db })
  return { ok: true, account: acc }
}

export function logout() {
  try {
    localStorage.removeItem(K_SESSION)
  } catch {
    /* abaikan */
  }
  emit({ account: null, db: null })
}

export async function registerOwner(input: { name: string; email: string; company: string; password: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase()
  if (accounts().some((a) => a.email.toLowerCase() === email)) return { ok: false, error: 'Email ini sudah terdaftar. Silakan masuk.' }
  const companyId = uid('c')
  const account: Account = { id: uid('acc'), email, hash: await sha256(input.password), name: input.name.trim(), role: 'owner', companyId }
  const db: DB = {
    company: { id: companyId, name: input.company.trim(), industry: '', timezone: 'Asia/Jakarta', requireSelfie: false },
    office: null,
    schedules: [{ id: uid('sch'), name: 'Reguler kantor', days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00', tolerance: 15, isDefault: true }],
    employees: [],
    attendance: [],
    audit: [],
  }
  if (!write(K_DB(companyId), db) || !write(K_ACCOUNTS, [...accounts(), account]) || !write(K_SESSION, { accountId: account.id })) {
    return { ok: false, error: 'Penyimpanan perangkat penuh atau diblokir. Pendaftaran tidak dapat disimpan.' }
  }
  emit({ account, db })
  return { ok: true }
}

export async function changePassword(oldPw: string, newPw: string): Promise<string | null> {
  const acc = snap.account
  if (!acc) return 'Sesi berakhir. Silakan masuk lagi.'
  if ((await sha256(oldPw)) !== acc.hash) return 'Kata sandi saat ini tidak cocok.'
  const next = { ...acc, hash: await sha256(newPw) }
  write(K_ACCOUNTS, accounts().map((a) => (a.id === acc.id ? next : a)))
  emit({ account: next })
  return null
}

/* ───────────── Mutasi database ───────────── */

const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', hr: 'HR', karyawan: 'Karyawan' }

function actorName() {
  const a = snap.account
  return a ? `${a.name} (${ROLE_LABEL[a.role]})` : 'Sistem'
}

function commit(mutate: (db: DB) => void, audit?: { action: string; target: string; detail: string }): boolean {
  if (!snap.db) return false
  const next = structuredClone(snap.db)
  mutate(next)
  if (audit) next.audit.unshift({ id: uid('aud'), at: Date.now(), actor: actorName(), ...audit })
  const ok = write(K_DB(next.company.id), next)
  emit({ db: ok ? next : snap.db, storageError: !ok })
  return ok
}

export function saveCompany(patch: Partial<Company>) {
  return commit((db) => Object.assign(db.company, patch), { action: 'Ubah profil perusahaan', target: snap.db?.company.name ?? '', detail: Object.keys(patch).join(', ') })
}

export function saveOffice(office: Office) {
  return commit((db) => (db.office = office), {
    action: 'Ubah lokasi kantor',
    target: office.name,
    detail: `Radius ${office.radius} m, akurasi maks ${office.maxAccuracy} m, titik ${office.lat.toFixed(5)}, ${office.lng.toFixed(5)}`,
  })
}

function randomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function createAccountFor(emp: Employee, companyId: string): Promise<{ email: string; tempPassword: string } | null> {
  const list = accounts()
  if (list.some((a) => a.email.toLowerCase() === emp.email.toLowerCase())) return null
  const tempPassword = randomPassword()
  const account: Account = { id: uid('acc'), email: emp.email.toLowerCase(), hash: await sha256(tempPassword), name: emp.name, role: 'karyawan', companyId, employeeId: emp.id }
  write(K_ACCOUNTS, [...list, account])
  return { email: emp.email, tempPassword }
}

export function validateEmployee(db: DB, e: Pick<Employee, 'nip' | 'email' | 'name'>, selfId?: string): string | null {
  if (!e.name.trim()) return 'Nama wajib diisi.'
  if (!e.nip.trim()) return 'NIP wajib diisi.'
  if (!/^\S+@\S+\.\S+$/.test(e.email)) return 'Format email tidak valid.'
  const others = db.employees.filter((x) => x.id !== selfId)
  if (others.some((x) => x.nip.toLowerCase() === e.nip.trim().toLowerCase())) return `NIP ${e.nip} sudah dipakai karyawan lain.`
  if (others.some((x) => x.email.toLowerCase() === e.email.trim().toLowerCase())) return `Email ${e.email} sudah dipakai karyawan lain.`
  return null
}

export async function saveEmployee(input: Omit<Employee, 'id'> & { id?: string }): Promise<{ error?: string; tempPassword?: string }> {
  const db = snap.db
  if (!db) return { error: 'Sesi berakhir.' }
  const error = validateEmployee(db, input, input.id)
  if (error) return { error }
  const isNew = !input.id
  const emp: Employee = { ...input, id: input.id ?? uid('e'), nip: input.nip.trim(), name: input.name.trim(), email: input.email.trim() }
  let temp: string | undefined
  if (isNew) {
    const created = await createAccountFor(emp, db.company.id)
    temp = created?.tempPassword
  }
  const ok = commit(
    (d) => {
      const i = d.employees.findIndex((e) => e.id === emp.id)
      if (i >= 0) d.employees[i] = emp
      else d.employees.push(emp)
    },
    { action: isNew ? 'Tambah karyawan' : 'Ubah karyawan', target: `${emp.name} (${emp.nip})`, detail: `${emp.department} · ${emp.position}` },
  )
  return ok ? { tempPassword: temp } : { error: 'Gagal menyimpan ke penyimpanan perangkat.' }
}

export function setEmployeeStatus(id: string, status: Employee['status']) {
  const emp = snap.db?.employees.find((e) => e.id === id)
  if (!emp) return false
  return commit((d) => (d.employees.find((e) => e.id === id)!.status = status), {
    action: status === 'active' ? 'Aktifkan karyawan' : 'Nonaktifkan karyawan',
    target: `${emp.name} (${emp.nip})`,
    detail: status === 'active' ? 'Akses absensi dibuka kembali' : 'Akses absensi ditutup, riwayat tetap tersimpan',
  })
}

export function setEmployeePhoto(id: string, photo: string | undefined) {
  return commit((d) => {
    const e = d.employees.find((x) => x.id === id)
    if (e) e.photo = photo
  })
}

export async function importEmployees(rows: Omit<Employee, 'id'>[]): Promise<{ count: number; accounts: { name: string; email: string; tempPassword: string }[] }> {
  const db = snap.db
  if (!db) return { count: 0, accounts: [] }
  const created: Employee[] = rows.map((r) => ({ ...r, id: uid('e') }))
  const made: { name: string; email: string; tempPassword: string }[] = []
  for (const emp of created) {
    const acc = await createAccountFor(emp, db.company.id)
    if (acc) made.push({ name: emp.name, ...acc })
  }
  commit((d) => d.employees.push(...created), { action: 'Impor karyawan (CSV)', target: `${created.length} karyawan`, detail: created.slice(0, 5).map((e) => e.name).join(', ') + (created.length > 5 ? ', …' : '') })
  return { count: created.length, accounts: made }
}

export function saveSchedule(s: Omit<Schedule, 'id'> & { id?: string }) {
  const isNew = !s.id
  const sch: Schedule = { ...s, id: s.id ?? uid('sch') }
  return commit(
    (d) => {
      if (sch.isDefault) d.schedules.forEach((x) => (x.isDefault = false))
      const i = d.schedules.findIndex((x) => x.id === sch.id)
      if (i >= 0) d.schedules[i] = sch
      else d.schedules.push(sch)
      if (!d.schedules.some((x) => x.isDefault)) d.schedules[0].isDefault = true
    },
    { action: isNew ? 'Tambah jadwal' : 'Ubah jadwal', target: sch.name, detail: `${sch.start}–${sch.end}, toleransi ${sch.tolerance} menit` },
  )
}

export function deleteSchedule(id: string): string | null {
  const db = snap.db
  const sch = db?.schedules.find((s) => s.id === id)
  if (!db || !sch) return 'Jadwal tidak ditemukan.'
  if (sch.isDefault) return 'Jadwal default tidak dapat dihapus. Jadikan jadwal lain sebagai default dulu.'
  const used = db.employees.filter((e) => e.scheduleId === id).length
  if (used) return `Masih dipakai ${used} karyawan. Pindahkan mereka ke jadwal lain dulu.`
  commit((d) => (d.schedules = d.schedules.filter((s) => s.id !== id)), { action: 'Hapus jadwal', target: sch.name, detail: '' })
  return null
}

export interface CorrectionInput {
  employeeId: string
  date: string
  status: AttStatus
  inTime?: string // HH:MM
  outTime?: string
  reason: string
}

/** Koreksi/catat manual. Alasan wajib dan masuk audit log bersama nilai sebelum–sesudah. */
export function correctAttendance(input: CorrectionInput): string | null {
  const db = snap.db
  const emp = db?.employees.find((e) => e.id === input.employeeId)
  if (!db || !emp) return 'Karyawan tidak ditemukan.'
  if (input.reason.trim().length < 8) return 'Alasan koreksi wajib diisi (minimal 8 karakter).'
  const worked = input.status === 'ontime' || input.status === 'late'
  if (worked && !input.inTime) return 'Jam masuk wajib diisi untuk status hadir.'
  if (input.inTime && input.outTime && input.outTime < input.inTime) return 'Jam pulang tidak boleh lebih awal dari jam masuk.'

  const tz = db.company.timezone
  // Prototipe: jam dinding dianggap WIB (+07:00). Zona lain dikonversi di backend.
  const toMs = (t?: string) => (t ? Date.parse(`${input.date}T${t}:00+07:00`) : undefined)
  const id = `${input.employeeId}_${input.date}`
  const before = db.attendance.find((a) => a.id === id)
  const sch = scheduleOf(db, emp)
  const inAt = worked ? toMs(input.inTime) : undefined
  const outAt = worked ? toMs(input.outTime) : undefined
  let status = input.status
  let lateMinutes = 0
  if (worked && inAt && sch) {
    const c = classify(zoned(inAt, tz).minutes, sch)
    // Admin boleh menetapkan status akhir; menit keterlambatan hanya dihitung bila statusnya "late".
    lateMinutes = status === 'late' ? Math.max(c.lateMinutes, 1) : 0
    if (status === 'ontime') lateMinutes = 0
  }
  const prevLabel = before ? `${before.status}` : 'belum ada catatan'
  const next: Attendance = {
    ...(before ?? { id, employeeId: emp.id, date: input.date }),
    status,
    lateMinutes,
    inAt,
    outAt,
    correction: { by: actorName(), at: Date.now(), reason: input.reason.trim() },
  }
  commit(
    (d) => {
      const i = d.attendance.findIndex((a) => a.id === id)
      if (i >= 0) d.attendance[i] = next
      else d.attendance.push(next)
    },
    {
      action: before ? 'Koreksi absensi' : 'Catat absensi manual',
      target: `${emp.name} · ${fmtDate(input.date)}`,
      detail: `${prevLabel} → ${status}${input.inTime ? `, masuk ${input.inTime}` : ''}${input.outTime ? `, pulang ${input.outTime}` : ''}. Alasan: ${input.reason.trim()}`,
    },
  )
  return null
}

/** Absen masuk/pulang. Waktu resmi diambil di sini (bukan dari form), lalu divalidasi `evaluate`. */
export function submitAttendance(employeeId: string, action: 'in' | 'out', input: AttemptInput): AttemptResult {
  const db = snap.db
  if (!db) return { ok: false, code: 'no_employee', message: 'Sesi berakhir. Silakan masuk lagi.' }
  const result = evaluate(db, employeeId, action, input, Date.now())
  if (!result.ok) return result
  const saved = commit((d) => {
    const i = d.attendance.findIndex((a) => a.id === result.record.id)
    if (i >= 0) d.attendance[i] = result.record
    else d.attendance.push(result.record)
  })
  return saved ? result : { ok: false, code: 'no_employee', message: 'Gagal menyimpan ke penyimpanan perangkat. Absensi belum tercatat, coba lagi.' }
}
