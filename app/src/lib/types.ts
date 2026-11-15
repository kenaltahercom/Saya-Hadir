export type Role = 'owner' | 'hr' | 'karyawan'
export type AttStatus = 'ontime' | 'late' | 'leave' | 'absent'

export interface Company {
  id: string
  name: string
  industry: string
  timezone: string
  requireSelfie: boolean
}

export interface Office {
  name: string
  address: string
  lat: number
  lng: number
  radius: number // meter
  maxAccuracy: number // meter
}

export interface Schedule {
  id: string
  name: string
  days: number[] // 0 = Minggu … 6 = Sabtu
  start: string // HH:MM
  end: string
  tolerance: number // menit
  isDefault: boolean
}

export interface Employee {
  id: string
  nip: string
  name: string
  email: string
  department: string
  position: string
  status: 'active' | 'inactive'
  joined: string // YYYY-MM-DD
  scheduleId: string
  photo?: string
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  inAt?: number
  outAt?: number
  status: AttStatus
  lateMinutes: number
  distanceIn?: number
  accuracyIn?: number
  distanceOut?: number
  selfie?: string
  correction?: { by: string; at: number; reason: string }
}

export interface AuditEntry {
  id: string
  at: number
  actor: string
  action: string
  target: string
  detail: string
}

export interface DB {
  company: Company
  office: Office | null
  schedules: Schedule[]
  employees: Employee[]
  attendance: Attendance[]
  audit: AuditEntry[]
}

export interface Account {
  id: string
  email: string
  hash: string
  name: string
  role: Role
  companyId: string
  employeeId?: string
}

export const STATUS_LABEL: Record<AttStatus, string> = {
  ontime: 'Tepat waktu',
  late: 'Terlambat',
  leave: 'Izin / cuti',
  absent: 'Tidak hadir',
}
