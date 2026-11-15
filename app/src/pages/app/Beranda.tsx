import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  MapPin,
  Timer,
} from 'lucide-react'
import { DayRow } from '../../components/dayrow'
import { Empty, Modal, Notice, StatusBadge } from '../../components/ui'
import { todayOf, useMe, useNow } from '../../lib/hooks'
import { addDays, DAY_NAMES, fmtClock, fmtDate, fmtDuration, greeting } from '../../lib/time'
import type { Attendance } from '../../lib/types'

export default function Beranda() {
  const { db, emp, sch } = useMe()
  const nowMs = useNow(1000) // 1 second interval for smooth elapsed timer
  const tz = db.company.timezone
  const today = todayOf(db, emp, sch, nowMs)
  const rec = today.record
  const month = today.now.date.slice(0, 7)
  const [selectedRec, setSelectedRec] = useState<Attendance | null>(null)

  const mine = db.attendance
    .filter((a) => a.employeeId === emp.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const monthRecs = mine.filter((a) => a.date.startsWith(month))
  const count = (s: string) => monthRecs.filter((a) => a.status === s).length

  // Live stopwatch for active working duration calculated during render
  let liveDuration = ''
  if (today.state === 'can_out' && rec?.inAt) {
    const diffSec = Math.max(0, Math.floor((nowMs - rec.inAt) / 1000))
    const h = Math.floor(diffSec / 3600)
    const m = Math.floor((diffSec % 3600) / 60)
    const s = diffSec % 60
    liveDuration = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  let nextWorkday = ''
  if (sch && today.state === 'not_workday') {
    for (let i = 1; i <= 7; i++) {
      const d = addDays(today.now.date, i)
      const dow = new Date(d + 'T00:00:00Z').getUTCDay()
      if (sch.days.includes(dow)) {
        nextWorkday = fmtDate(d, true)
        break
      }
    }
  }

  return (
    <div className="u-dashboard">
      {/* User Header */}
      <section className="u-head">
        <div className="u-greeting-box">
          <h1 className="u-greeting">
            {greeting(today.now.minutes)}, {emp.name.split(' ')[0]}
          </h1>
          <div className="u-date-row">
            <span className="u-date-text">{fmtDate(today.now.date, true)}</span>
            <span className="u-chip-online">
              <span className="u-live-dot" />
              <span>Sistem Aktif</span>
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Main Attendance Card (Minimalist & Modern) */}
      {today.state === 'can_in' && (
        <section className="u-action-card can-in" aria-label="Status absensi hari ini">
          <div className="u-card-top">
            <span className="u-card-tag">Hari ini</span>
            <div className="u-badge-pulse">Siap Absen Masuk</div>
          </div>

          <div className="u-card-body">
            <h2 className="u-card-title">Belum Absen Masuk</h2>
            <p className="u-card-desc">
              Jadwal <strong>{sch?.start} – {sch?.end}</strong> · Toleransi {sch?.tolerance} mnt
            </p>
            <div className="u-card-meta">
              <MapPin size={15} className="text-green" />
              <span>Area {db.office?.name ?? 'Kantor'} (GPS Aktif)</span>
            </div>
          </div>

          <Link to="/app/absen" className="u-btn-cta primary">
            <MapPin size={19} aria-hidden="true" />
            <span>Absen Masuk Sekarang</span>
            <ArrowRight size={17} className="u-arrow-slide" />
          </Link>
        </section>
      )}

      {today.state === 'can_out' && rec && (
        <section className="u-action-card working" aria-label="Status absensi hari ini">
          <div className="u-card-top">
            <span className="u-card-tag">Sedang Bekerja</span>
            <StatusBadge
              status={rec.status}
              label={rec.status === 'late' ? `Terlambat ${rec.lateMinutes}m` : 'Tepat Waktu'}
            />
          </div>

          <div className="u-card-body">
            <div className="u-timer-box">
              <span className="u-timer-label">Durasi Kerja Berjalan</span>
              <div className="u-timer-display num">
                <Timer size={20} className="pulse-icon text-green" />
                <span>{liveDuration || '00:00:00'}</span>
              </div>
            </div>

            <div className="u-work-meta-row">
              <div>
                <span className="muted small">Masuk</span>
                <strong className="num">{fmtClock(rec.inAt, tz)}</strong>
              </div>
              <div>
                <span className="muted small">Jadwal Pulang</span>
                <strong className="num">{sch?.end}</strong>
              </div>
            </div>
          </div>

          <Link to="/app/absen" className="u-btn-cta dark">
            <MapPin size={19} aria-hidden="true" />
            <span>Absen Pulang</span>
            <ArrowRight size={17} className="u-arrow-slide" />
          </Link>
        </section>
      )}

      {today.state === 'done' && rec && (
        <section className="u-action-card completed" aria-label="Status absensi hari ini">
          <div className="u-card-top">
            <span className="u-card-tag">Selesai Hari Ini</span>
            <StatusBadge status={rec.status} />
          </div>

          <div className="u-done-grid">
            <div className="u-done-col">
              <span className="muted small">Masuk</span>
              <strong className="num">{fmtClock(rec.inAt, tz)}</strong>
            </div>
            <div className="u-done-col">
              <span className="muted small">Pulang</span>
              <strong className="num">{fmtClock(rec.outAt, tz)}</strong>
            </div>
            <div className="u-done-col">
              <span className="muted small">Durasi</span>
              <strong className="num">{fmtDuration(rec.inAt, rec.outAt)}</strong>
            </div>
          </div>

          <div className="u-done-note">
            <CheckCircle2 size={16} className="text-green" />
            <span>Absensi lengkap. Terima kasih atas kerja keras Anda hari ini!</span>
          </div>
        </section>
      )}

      {today.state === 'not_workday' && (
        <section className="u-action-card holiday">
          <div className="u-card-top">
            <span className="u-card-tag">Hari Ini</span>
            <span className="u-chip-neutral">Bukan Hari Kerja</span>
          </div>
          <div className="u-holiday-body">
            <h2 className="u-holiday-title">Selamat Beristirahat</h2>
            <p className="u-card-desc">
              Jadwal “{sch?.name}” aktif {sch?.days.map((d) => DAY_NAMES[d]).join(', ')}.
            </p>
            {nextWorkday && (
              <div className="u-next-workday">
                <Calendar size={15} />
                <span>Hari kerja berikutnya: <strong>{nextWorkday}</strong></span>
              </div>
            )}
          </div>
          <button className="u-btn-disabled" disabled>
            Absen tidak tersedia hari ini
          </button>
        </section>
      )}

      {today.state === 'recorded_other' && rec && (
        <Notice tone="info" title="Hari ini sudah dicatat admin">
          Status: {rec.status === 'leave' ? 'izin / cuti' : 'tidak hadir'}. Hubungi HR bila ada kesalahan.
        </Notice>
      )}
      {today.state === 'no_office' && (
        <Notice tone="warn" title="Absensi belum bisa dipakai">
          Admin belum mengatur lokasi kantor. Hubungi HR perusahaan Anda.
        </Notice>
      )}
      {today.state === 'inactive' && (
        <Notice tone="bad" title="Akun dinonaktifkan">
          Hubungi HR perusahaan Anda.
        </Notice>
      )}

      {/* Monthly Attendance Tally (Minimal & Interactive Pills) */}
      <section className="u-section">
        <div className="u-section-head">
          <h2 className="u-section-title">Bulan Ini</h2>
          <span className="u-section-sub num">{monthRecs.length} Tercatat</span>
        </div>

        <div className="u-tally-grid">
          <Link to="/app/riwayat" className="u-tally-card green">
            <div className="u-tally-dot dot-green" />
            <strong className="num u-tally-val">{count('ontime')}</strong>
            <span className="u-tally-lbl">Tepat Waktu</span>
          </Link>
          <Link to="/app/riwayat" className="u-tally-card amber">
            <div className="u-tally-dot dot-amber" />
            <strong className="num u-tally-val">{count('late')}</strong>
            <span className="u-tally-lbl">Terlambat</span>
          </Link>
          <Link to="/app/riwayat" className="u-tally-card blue">
            <div className="u-tally-dot dot-blue" />
            <strong className="num u-tally-val">{count('leave')}</strong>
            <span className="u-tally-lbl">Izin / Cuti</span>
          </Link>
          <Link to="/app/riwayat" className="u-tally-card gray">
            <div className="u-tally-dot dot-gray" />
            <strong className="num u-tally-val">{count('absent')}</strong>
            <span className="u-tally-lbl">Tidak Hadir</span>
          </Link>
        </div>
      </section>

      {/* Recent Attendance List */}
      <section className="u-section">
        <div className="u-section-head">
          <h2 className="u-section-title">Riwayat Terakhir</h2>
          <Link to="/app/riwayat" className="u-link-more">
            <span>Lihat semua</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {mine.length ? (
          <div className="u-recent-list">
            {mine.slice(0, 5).map((r) => (
              <div key={r.id} className="u-recent-item" onClick={() => setSelectedRec(r)}>
                <DayRow rec={r} tz={tz} onClick={() => setSelectedRec(r)} />
              </div>
            ))}
          </div>
        ) : (
          <Empty title="Belum ada riwayat">
            Catatan absensi Anda akan muncul di sini setelah absen pertama.
          </Empty>
        )}
      </section>

      {/* Detail Modal when clicking on a record */}
      {selectedRec && (
        <Modal title="Detail Absensi" onClose={() => setSelectedRec(null)}>
          <div className="stack">
            <div className="row between">
              <strong>{fmtDate(selectedRec.date, true)}</strong>
              <StatusBadge status={selectedRec.status} />
            </div>

            <dl className="facts">
              <div>
                <dt>Jam Masuk</dt>
                <dd className="num">{fmtClock(selectedRec.inAt, tz)}</dd>
              </div>
              <div>
                <dt>Jam Pulang</dt>
                <dd className="num">{fmtClock(selectedRec.outAt, tz)}</dd>
              </div>
              <div>
                <dt>Total Jam Kerja</dt>
                <dd className="num">{fmtDuration(selectedRec.inAt, selectedRec.outAt)}</dd>
              </div>
            </dl>

            {selectedRec.selfie && (
              <div>
                <p className="muted small" style={{ marginBottom: 6 }}>
                  Foto selfie saat masuk:
                </p>
                <img
                  src={selectedRec.selfie}
                  alt="Selfie absensi"
                  style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12 }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
