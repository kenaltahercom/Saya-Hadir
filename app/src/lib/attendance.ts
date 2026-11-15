import type { Attendance, DB, Employee, Schedule } from './types'
import { STATUS_LABEL } from './types'
import { toMinutes, zoned } from './time'

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function scheduleOf(db: DB, emp: Employee): Schedule | undefined {
  return db.schedules.find((s) => s.id === emp.scheduleId) ?? db.schedules.find((s) => s.isDefault)
}

/** Terlambat bila masuk melewati jam masuk + toleransi. Menit keterlambatan dihitung dari jam masuk. */
export function classify(minutes: number, sch: Schedule): { status: 'ontime' | 'late'; lateMinutes: number } {
  const start = toMinutes(sch.start)
  if (minutes > start + sch.tolerance) return { status: 'late', lateMinutes: minutes - start }
  return { status: 'ontime', lateMinutes: 0 }
}

export type AttemptCode =
  | 'no_employee'
  | 'inactive'
  | 'no_office'
  | 'not_workday'
  | 'recorded_other'
  | 'already_in'
  | 'already_out'
  | 'no_checkin'
  | 'selfie_required'
  | 'accuracy'
  | 'distance'

export interface AttemptInput {
  lat: number
  lng: number
  accuracy: number
  selfie?: string
}

export type AttemptResult =
  | { ok: true; action: 'in' | 'out'; record: Attendance; distance: number }
  | { ok: false; code: AttemptCode; message: string; distance?: number }

const fail = (code: AttemptCode, message: string, distance?: number): AttemptResult => ({ ok: false, code, message, distance })

/**
 * Keputusan absensi. Fungsi murni: tidak menyentuh penyimpanan, waktu resmi dikirim dari luar (`nowMs`).
 * Di versi Supabase, logika yang sama dijalankan di database function — klien tidak pernah menjadi penentu final.
 */
export function evaluate(db: DB, employeeId: string, action: 'in' | 'out', input: AttemptInput, nowMs: number): AttemptResult {
  const emp = db.employees.find((e) => e.id === employeeId)
  if (!emp) return fail('no_employee', 'Data karyawan tidak ditemukan.')
  if (emp.status !== 'active') return fail('inactive', 'Akun Anda dinonaktifkan. Hubungi HR perusahaan.')
  if (!db.office) return fail('no_office', 'Lokasi kantor belum diatur oleh admin, jadi absensi belum bisa dilakukan.')

  const sch = scheduleOf(db, emp)
  const now = zoned(nowMs, db.company.timezone)
  if (!sch || !sch.days.includes(now.dow)) return fail('not_workday', 'Hari ini bukan hari kerja pada jadwal Anda.')

  const existing = db.attendance.find((a) => a.employeeId === emp.id && a.date === now.date)
  if (existing && !existing.inAt) {
    return fail('recorded_other', `Hari ini sudah dicatat admin sebagai “${STATUS_LABEL[existing.status]}”.`)
  }
  if (action === 'in' && existing?.inAt) return fail('already_in', 'Anda sudah absen masuk hari ini.')
  if (action === 'out') {
    if (!existing?.inAt) return fail('no_checkin', 'Absen pulang hanya bisa dilakukan setelah absen masuk.')
    if (existing.outAt) return fail('already_out', 'Anda sudah absen pulang hari ini.')
  }
  if (action === 'in' && db.company.requireSelfie && !input.selfie) {
    return fail('selfie_required', 'Perusahaan mewajibkan foto selfie saat absen masuk.')
  }

  if (input.accuracy > db.office.maxAccuracy) {
    return fail(
      'accuracy',
      `Akurasi GPS ${Math.round(input.accuracy)} m, batasnya ${db.office.maxAccuracy} m. Pindah ke area terbuka atau aktifkan lokasi presisi, lalu coba lagi.`,
    )
  }
  const distance = distanceMeters(input.lat, input.lng, db.office.lat, db.office.lng)
  if (distance > db.office.radius) {
    return fail('distance', `Anda ${distance} m dari ${db.office.name}. Batas absensi ${db.office.radius} m.`, distance)
  }

  if (action === 'in') {
    const { status, lateMinutes } = classify(now.minutes, sch)
    return {
      ok: true,
      action,
      distance,
      record: {
        id: `${emp.id}_${now.date}`,
        employeeId: emp.id,
        date: now.date,
        inAt: nowMs,
        status,
        lateMinutes,
        distanceIn: distance,
        accuracyIn: Math.round(input.accuracy),
        selfie: input.selfie,
      },
    }
  }
  return { ok: true, action, distance, record: { ...existing!, outAt: nowMs, distanceOut: distance } }
}
