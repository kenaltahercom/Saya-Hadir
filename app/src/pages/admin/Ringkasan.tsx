import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Avatar, Empty, Notice, StatusBadge } from '../../components/ui'
import { useNow } from '../../lib/hooks'
import { scheduleOf } from '../../lib/attendance'
import { useStore } from '../../lib/store'
import type { Attendance, Employee, Schedule } from '../../lib/types'
import { addDays, dowOf, fmtClock, fmtDate, toMinutes, zoned } from '../../lib/time'

interface Row {
  emp: Employee
  sch?: Schedule
  rec?: Attendance
}

export default function Ringkasan() {
  const { db } = useStore()
  const nowMs = useNow(1000) // 1-second update for live clock tracker
  const [span, setSpan] = useState(7) // 7 days default like Image 1
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const d = db!
  const tz = d.company.timezone
  const now = zoned(nowMs, tz)

  const rows: Row[] = useMemo(
    () =>
      d.employees
        .filter((e) => e.status === 'active')
        .map((emp) => ({
          emp,
          sch: scheduleOf(d, emp),
          rec: d.attendance.find((a) => a.employeeId === emp.id && a.date === now.date),
        }))
        .filter((r) => r.sch?.days.includes(now.dow) || r.rec),
    [d, now.date, now.dow],
  )

  const ontime = rows.filter((r) => r.rec?.status === 'ontime').length
  const late = rows.filter((r) => r.rec?.status === 'late').length
  const leave = rows.filter((r) => r.rec?.status === 'leave' || r.rec?.status === 'absent').length
  const pending = rows.filter((r) => !r.rec)
  const totalScheduled = rows.length

  /* Attendance percentage calculation */
  const attendanceRate = totalScheduled > 0 ? Math.round(((ontime + late) / totalScheduled) * 100) : 0

  /* Perlu perhatian */
  const overdue = pending.filter((r) => r.sch && now.minutes > toMinutes(r.sch.start) + r.sch.tolerance)
  const noOut = rows.filter((r) => r.rec?.inAt && !r.rec.outAt && r.sch && now.minutes > toMinutes(r.sch.end))
  const since = addDays(now.date, -30)
  const frequentLate = d.employees
    .map((e) => ({
      e,
      n: d.attendance.filter((a) => a.employeeId === e.id && a.status === 'late' && a.date >= since).length,
    }))
    .filter((x) => x.n >= 3 && x.e.status === 'active')
    .sort((a, b) => b.n - a.n)

  /* Checklist awal */
  const todo = [
    !d.office && { to: '/admin/lokasi', text: 'Atur lokasi kantor, radius, dan akurasi GPS', why: 'Tanpa ini karyawan belum bisa absen.' },
    !d.employees.length && { to: '/admin/karyawan', text: 'Tambahkan karyawan pertama atau impor CSV', why: 'Karyawan mendapat akun untuk masuk dari ponsel.' },
  ].filter(Boolean) as { to: string; text: string; why: string }[]

  /* Tren kehadiran */
  const days = Array.from({ length: span }, (_, i) => addDays(now.date, i - (span - 1)))
  const trend = days.map((date) => {
    const recs = d.attendance.filter((a) => a.date === date)
    const ontimeCount = recs.filter((a) => a.status === 'ontime').length
    const lateCount = recs.filter((a) => a.status === 'late').length
    const total = ontimeCount + lateCount
    return {
      date,
      ontime: ontimeCount,
      late: lateCount,
      total,
      dow: dowOf(date),
    }
  })
  const max = Math.max(1, ...trend.map((t) => t.total))

  // Live digital clock time string
  const dateObj = new Date(nowMs)
  const timeStr = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: tz,
  })

  // Semicircle gauge calculation
  // Gauge is drawn from 180deg to 360deg (half circle of radius 60, perimeter = PI * 60 = ~188.5)
  const strokeDashoffset = 188.5 - (attendanceRate / 100) * 188.5

  return (
    <div className="donezo-dashboard">
      {/* Page Header Donezo style */}
      <div className="donezo-head">
        <div>
          <h1 className="donezo-title">Dashboard</h1>
          <p className="donezo-sub">Pantau, jadwalkan, dan kelola kehadiran tim dengan mudah.</p>
        </div>
        <div className="donezo-actions">
          <Link to="/admin/karyawan" className="btn-donezo-primary">
            <Plus size={16} />
            <span>Tambah Karyawan</span>
          </Link>
          <Link to="/admin/rekap" className="btn-donezo-secondary">
            <FileSpreadsheet size={15} />
            <span>Ekspor Rekap</span>
          </Link>
        </div>
      </div>

      {/* Notice if setup incomplete */}
      {todo.length > 0 && (
        <Notice tone="warn" title="Selesaikan konfigurasi perusahaan">
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {todo.map((t) => (
              <li key={t.to}>
                <Link to={t.to} style={{ fontWeight: 600 }}>
                  {t.text}
                </Link>{' '}
                <span className="muted">— {t.why}</span>
              </li>
            ))}
          </ul>
        </Notice>
      )}

      {/* 4 Stat Cards Row ala Donezo Image 1 */}
      <div className="donezo-stats-row">
        {/* Card 1: Signature Forest Green Card */}
        <div className="donezo-card-highlight">
          <div className="donezo-stat-head">
            <span>Total Terjadwal</span>
            <Link to="/admin/karyawan" className="donezo-stat-arrow-btn" aria-label="Lihat data karyawan">
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="donezo-stat-num">{totalScheduled}</div>
          <div className="donezo-stat-badge-light">
            <span>{d.employees.filter((e) => e.status === 'active').length} Karyawan Aktif</span>
          </div>
        </div>

        {/* Card 2: Tepat Waktu */}
        <div className="donezo-stat-card">
          <div className="donezo-stat-head">
            <span className="muted">Tepat Waktu</span>
            <Link to="/admin/rekap" className="donezo-stat-arrow-btn-light" aria-label="Buka rekap">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="donezo-stat-num-dark">{ontime}</div>
          <div className="donezo-stat-meta">
            <span className="stat-pill-green">Tepat Waktu</span>
            <span className="muted small">Hari ini</span>
          </div>
        </div>

        {/* Card 3: Terlambat */}
        <div className="donezo-stat-card">
          <div className="donezo-stat-head">
            <span className="muted">Terlambat</span>
            <Link to="/admin/rekap" className="donezo-stat-arrow-btn-light" aria-label="Buka rekap">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="donezo-stat-num-dark">{late}</div>
          <div className="donezo-stat-meta">
            <span className="stat-pill-amber">Melewati Jadwal</span>
            <span className="muted small">Toleransi {d.schedules[0]?.tolerance ?? 15}m</span>
          </div>
        </div>

        {/* Card 4: Belum Absen / Izin */}
        <div className="donezo-stat-card">
          <div className="donezo-stat-head">
            <span className="muted">Belum Hadir</span>
            <Link to="/admin/rekap" className="donezo-stat-arrow-btn-light" aria-label="Buka rekap">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="donezo-stat-num-dark">{pending.length + leave}</div>
          <div className="donezo-stat-meta">
            <span className="stat-pill-gray">{leave ? `${leave} Izin/Cuti` : 'Menunggu'}</span>
            <span className="muted small">Dari {totalScheduled} jadwal</span>
          </div>
        </div>
      </div>

      {/* Middle Row Grid ala Image 1: Analytics + Reminders + Schedule */}
      <div className="donezo-middle-grid">
        {/* Project Analytics: Pill-shaped Bar Chart */}
        <div className="donezo-panel donezo-panel-analytics">
          <div className="donezo-panel-head">
            <div>
              <h2>Statistik Kehadiran</h2>
              <p className="muted small">Tren absensi tepat waktu & terlambat</p>
            </div>
            <div className="donezo-period-picker">
              <button
                type="button"
                className={`donezo-period-btn ${span === 7 ? 'active' : ''}`}
                onClick={() => setSpan(7)}
              >
                7 Hari
              </button>
              <button
                type="button"
                className={`donezo-period-btn ${span === 14 ? 'active' : ''}`}
                onClick={() => setSpan(14)}
              >
                14 Hari
              </button>
            </div>
          </div>

          <div className="donezo-bars-container">
            {trend.map((t, i) => {
              const dayLetters = ['M', 'S', 'S', 'R', 'K', 'J', 'S'] // Ming, Sen, Sel, Rab, Kam, Jum, Sab
              const isHovered = hoveredBar === i
              const pct = t.total > 0 ? Math.round((t.ontime / t.total) * 100) : 0
              const heightPct = max > 0 ? Math.max(12, Math.round((t.total / max) * 100)) : 12

              return (
                <div
                  key={t.date}
                  className="donezo-bar-col"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Floating tooltip on hover */}
                  {isHovered && (
                    <div className="donezo-bar-tooltip">
                      <strong>{pct}%</strong>
                      <span>
                        {t.ontime} tepat · {t.late} telat
                      </span>
                    </div>
                  )}

                  {/* Pill Bar Column with Donezo style hatching and fill */}
                  <div className="donezo-bar-pill-outer">
                    <div
                      className={`donezo-bar-pill-fill ${i % 2 === 1 ? 'bar-hatched' : 'bar-solid'}`}
                      style={{
                        height: `${heightPct}%`,
                        opacity: t.dow === 0 || t.dow === 6 ? 0.45 : 1,
                      }}
                    >
                      {t.late > 0 && <div className="donezo-bar-late-cap" style={{ height: `${Math.round((t.late / t.total) * 100)}%` }} />}
                    </div>
                  </div>

                  <span className="donezo-bar-day-label">{dayLetters[t.dow]}</span>
                </div>
              )
            })}
          </div>

          <div className="donezo-bars-legend">
            <span className="legend-item">
              <span className="legend-dot-solid" />
              Tepat Waktu
            </span>
            <span className="legend-item">
              <span className="legend-dot-amber" />
              Terlambat
            </span>
            <span className="legend-item">
              <span className="legend-dot-hatch" />
              Hari Libur
            </span>
          </div>
        </div>

        {/* Reminders / Pengingat & Perhatian */}
        <div className="donezo-panel donezo-panel-reminders">
          <div className="donezo-panel-head">
            <h2>Pengingat & Perhatian</h2>
          </div>
          <div className="donezo-panel-body">
            {overdue.length + noOut.length + frequentLate.length === 0 ? (
              <div className="donezo-empty-state">
                <CheckCircle2 size={32} className="text-green" />
                <strong>Semua Berjalan Lancar</strong>
                <p className="muted small">Tidak ada karyawan yang melewati batas waktu atau jadwal hari ini.</p>
              </div>
            ) : (
              <div className="donezo-reminders-list">
                {overdue.length > 0 && (
                  <div className="donezo-reminder-item">
                    <div className="reminder-icon-badge warn">
                      <Clock size={16} />
                    </div>
                    <div className="reminder-text">
                      <strong>Toleransi Lewat ({overdue.length})</strong>
                      <p className="muted small">
                        {overdue.slice(0, 3).map((r) => r.emp.name).join(', ')}
                        {overdue.length > 3 ? ` +${overdue.length - 3} lainnya` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {noOut.length > 0 && (
                  <div className="donezo-reminder-item">
                    <div className="reminder-icon-badge info">
                      <AlertCircle size={16} />
                    </div>
                    <div className="reminder-text">
                      <strong>Belum Absen Pulang ({noOut.length})</strong>
                      <p className="muted small">{noOut.slice(0, 3).map((r) => r.emp.name).join(', ')}</p>
                    </div>
                  </div>
                )}

                {frequentLate.slice(0, 2).map((x) => (
                  <div key={x.e.id} className="donezo-reminder-item">
                    <div className="reminder-icon-badge warn">
                      <Clock size={16} />
                    </div>
                    <div className="reminder-text">
                      <strong>{x.e.name}</strong>
                      <p className="muted small">Terlambat {x.n}x dalam 30 hari terakhir</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="donezo-reminder-foot">
              <Link to="/admin/rekap" className="btn-donezo-reminder">
                <span>Lihat Detail Rekap</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Project List / Jadwal & Shift Kerja ala Image 1 */}
        <div className="donezo-panel donezo-panel-projects">
          <div className="donezo-panel-head">
            <h2>Jadwal Kerja</h2>
            <Link to="/admin/jadwal" className="donezo-btn-new">
              <Plus size={13} />
              <span>Baru</span>
            </Link>
          </div>
          <div className="donezo-project-list">
            {d.schedules.map((s, idx) => {
              const assigned = d.employees.filter((e) => (e.scheduleId || d.schedules[0]?.id) === s.id).length
              const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
              const color = colors[idx % colors.length]

              return (
                <div key={s.id} className="donezo-project-item">
                  <div className="donezo-project-color-bar" style={{ background: color }} />
                  <div className="donezo-project-info">
                    <strong>{s.name}</strong>
                    <span className="muted small">
                      {s.start} – {s.end} · {s.days.length} hari kerja
                    </span>
                  </div>
                  <div className="donezo-project-users">
                    <span className="donezo-user-count-pill">{assigned} org</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row Grid ala Image 1: Team Collaboration + Progress Donut + Time Tracker */}
      <div className="donezo-bottom-grid">
        {/* Team Collaboration: Karyawan Terkini Table */}
        <div className="donezo-panel donezo-panel-team">
          <div className="donezo-panel-head">
            <div>
              <h2>Status Tim Hari Ini</h2>
              <p className="muted small">Kehadiran real-time karyawan</p>
            </div>
            <Link to="/admin/karyawan" className="donezo-btn-new">
              <Plus size={13} />
              <span>Kelola Tim</span>
            </Link>
          </div>

          <div className="donezo-team-list">
            {rows.length === 0 ? (
              <Empty title="Tidak ada jadwal hari ini">Hari ini bukan hari kerja pada jadwal mana pun.</Empty>
            ) : (
              rows.slice(0, 5).map((r) => (
                <div key={r.emp.id} className="donezo-team-row">
                  <div className="donezo-team-user">
                    <Avatar name={r.emp.name} photo={r.emp.photo} size={36} />
                    <div>
                      <strong>{r.emp.name}</strong>
                      <span className="muted small">{r.emp.department}</span>
                    </div>
                  </div>
                  <div className="donezo-team-time num small">
                    {r.rec?.inAt ? fmtClock(r.rec.inAt, tz) : '—'}
                  </div>
                  <div className="donezo-team-status">
                    {r.rec ? (
                      <StatusBadge status={r.rec.status} />
                    ) : (
                      <span className="stat-pill-gray">Belum Hadir</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Progress: Donut / Arc Progress Meter */}
        <div className="donezo-panel donezo-panel-progress">
          <div className="donezo-panel-head">
            <h2>Persentase Kehadiran</h2>
          </div>
          <div className="donezo-gauge-wrap">
            <svg viewBox="0 0 160 100" className="donezo-gauge-svg">
              {/* Background Arc */}
              <path
                d="M 20 85 A 60 60 0 0 1 140 85"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Completed Arc */}
              <path
                d="M 20 85 A 60 60 0 0 1 140 85"
                fill="none"
                stroke="#143e2e"
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={strokeDashoffset}
                className="gauge-arc-anim"
              />
            </svg>
            <div className="donezo-gauge-center">
              <strong>{attendanceRate}%</strong>
              <span>Target Kehadiran</span>
            </div>
          </div>

          <div className="donezo-gauge-legend">
            <div className="gauge-legend-col">
              <span className="gauge-legend-dot done" />
              <span>Tepat Waktu: {ontime}</span>
            </div>
            <div className="gauge-legend-col">
              <span className="gauge-legend-dot in-progress" />
              <span>Terlambat: {late}</span>
            </div>
            <div className="gauge-legend-col">
              <span className="gauge-legend-dot pending" />
              <span>Belum: {pending.length}</span>
            </div>
          </div>
        </div>

        {/* Time Tracker Card ala Image 1 (Dark forest green with digital clock) */}
        <div className="donezo-panel donezo-panel-tracker">
          <div className="tracker-wave-bg" aria-hidden="true" />
          <div className="tracker-top">
            <span className="tracker-label">Jam Operasional</span>
            <div className="tracker-gps-dot">
              <span className="pulse-dot" />
              <span>GPS Aktif</span>
            </div>
          </div>

          <div className="tracker-clock-display">
            <div className="tracker-digital-time">{timeStr}</div>
            <div className="tracker-date-lbl">{fmtDate(now.date, true)}</div>
          </div>

          <div className="tracker-bottom">
            <div className="tracker-location-info">
              <strong>{d.office?.name ?? 'Kantor Pusat'}</strong>
              <span>Radius {d.office?.radius ?? 150}m aktif</span>
            </div>
            <Link to="/admin/lokasi" className="tracker-btn-ctrl" title="Atur Lokasi Kantor">
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
