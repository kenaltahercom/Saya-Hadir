import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayRow } from '../../components/dayrow'
import { Empty, Modal, StatusBadge } from '../../components/ui'
import { useMe, useNow } from '../../lib/hooks'
import type { Attendance } from '../../lib/types'
import { fmtClock, fmtDate, fmtDateTime, fmtDuration, fmtMonth, shiftMonth, zoned } from '../../lib/time'

export default function Riwayat() {
  const { db, emp } = useMe()
  const nowMs = useNow(60000)
  const tz = db.company.timezone
  const thisMonth = zoned(nowMs, tz).date.slice(0, 7)
  const [month, setMonth] = useState(thisMonth)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [open, setOpen] = useState<Attendance | null>(null)

  const rawRecs = db.attendance
    .filter((a) => a.employeeId === emp.id && a.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))

  const count = (s: string) => rawRecs.filter((a) => a.status === s).length

  const recs = filterStatus === 'all' ? rawRecs : rawRecs.filter((a) => a.status === filterStatus)

  return (
    <div className="u-dashboard">
      <div>
        <h1 className="u-greeting">Riwayat Absensi</h1>
        <p className="u-date-text">Catatan kehadiran dan durasi kerja per bulan</p>
      </div>

      {/* Month Navigator */}
      <div className="month-nav">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={20} />
        </button>
        <strong style={{ fontSize: 16 }}>{fmtMonth(month)}</strong>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={month >= thisMonth}
          aria-label="Bulan berikutnya"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Interactive Month Tallies (Clickable filters) */}
      <div className="u-tally-grid">
        <button
          type="button"
          className={`u-tally-card green ${filterStatus === 'ontime' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'ontime' ? 'all' : 'ontime')}
        >
          <div className="u-tally-dot dot-green" />
          <strong className="num u-tally-val">{count('ontime')}</strong>
          <span className="u-tally-lbl">Tepat Waktu</span>
        </button>
        <button
          type="button"
          className={`u-tally-card amber ${filterStatus === 'late' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'late' ? 'all' : 'late')}
        >
          <div className="u-tally-dot dot-amber" />
          <strong className="num u-tally-val">{count('late')}</strong>
          <span className="u-tally-lbl">Terlambat</span>
        </button>
        <button
          type="button"
          className={`u-tally-card blue ${filterStatus === 'leave' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'leave' ? 'all' : 'leave')}
        >
          <div className="u-tally-dot dot-blue" />
          <strong className="num u-tally-val">{count('leave')}</strong>
          <span className="u-tally-lbl">Izin / Cuti</span>
        </button>
        <button
          type="button"
          className={`u-tally-card gray ${filterStatus === 'absent' ? 'is-active-filter' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'absent' ? 'all' : 'absent')}
        >
          <div className="u-tally-dot dot-gray" />
          <strong className="num u-tally-val">{count('absent')}</strong>
          <span className="u-tally-lbl">Tidak Hadir</span>
        </button>
      </div>

      {filterStatus !== 'all' && (
        <div className="row between" style={{ padding: '0 4px' }}>
          <span className="small muted">
            Menampilkan filter: <strong>{filterStatus}</strong> ({recs.length} data)
          </span>
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => setFilterStatus('all')}>
            Reset filter
          </button>
        </div>
      )}

      {/* Record List */}
      {recs.length ? (
        <div className="u-recent-list">
          {recs.map((r) => (
            <div key={r.id} className="u-recent-item" onClick={() => setOpen(r)}>
              <DayRow rec={r} tz={tz} onClick={() => setOpen(r)} />
            </div>
          ))}
        </div>
      ) : (
        <Empty title={`Tidak ada catatan di ${fmtMonth(month)}`}>
          {filterStatus !== 'all'
            ? 'Tidak ada data dengan filter status ini.'
            : 'Absensi yang Anda lakukan akan muncul di sini.'}
        </Empty>
      )}

      {/* Detail Modal */}
      {open && (
        <Modal title={fmtDate(open.date, true)} onClose={() => setOpen(null)}>
          <div className="stack">
            <div className="row between">
              <strong>Status Absensi</strong>
              <StatusBadge
                status={open.status}
                label={open.status === 'late' ? `Terlambat ${open.lateMinutes} menit` : undefined}
              />
            </div>
            <dl className="defs panel panel-body">
              <dt>Masuk</dt>
              <dd className="num">{fmtClock(open.inAt, tz)}</dd>
              <dt>Pulang</dt>
              <dd className="num">{fmtClock(open.outAt, tz)}</dd>
              <dt>Durasi kerja</dt>
              <dd className="num">{fmtDuration(open.inAt, open.outAt)}</dd>
              {open.distanceIn !== undefined && (
                <>
                  <dt>Jarak masuk</dt>
                  <dd className="num">{open.distanceIn} m dari kantor</dd>
                </>
              )}
              {open.accuracyIn !== undefined && (
                <>
                  <dt>Akurasi GPS</dt>
                  <dd className="num">{open.accuracyIn} m</dd>
                </>
              )}
            </dl>
            {open.selfie && (
              <div>
                <p className="muted small" style={{ marginBottom: 6 }}>
                  Foto selfie saat masuk:
                </p>
                <div className="camera" style={{ maxWidth: 220, margin: '0 auto' }}>
                  <img src={open.selfie} alt="Foto selfie saat absen masuk" />
                </div>
              </div>
            )}
            {open.correction && (
              <div className="notice notice-info">
                <div className="notice-body">
                  <strong>Dikoreksi Admin</strong>
                  <div>{open.correction.reason}</div>
                  <div className="hint">
                    {open.correction.by} · {fmtDateTime(open.correction.at, tz)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
