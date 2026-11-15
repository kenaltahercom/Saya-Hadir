import { ChevronRight } from 'lucide-react'
import type { Attendance } from '../lib/types'
import { DAY_SHORT, dowOf, fmtClock } from '../lib/time'
import { StatusBadge } from './ui'

export function DayRow({ rec, tz, onClick }: { rec: Attendance; tz: string; onClick?: () => void }) {
  const day = Number(rec.date.slice(8))
  const worked = rec.status === 'ontime' || rec.status === 'late'
  const sub = worked ? `Masuk ${fmtClock(rec.inAt, tz)} · Pulang ${rec.outAt ? fmtClock(rec.outAt, tz) : 'belum'}` : rec.correction ? 'Dicatat oleh admin' : 'Tanpa absensi'
  const body = (
    <>
      <span className="date-chip">
        <b className="num">{day}</b>
        <span>{DAY_SHORT[dowOf(rec.date)]}</span>
      </span>
      <span className="list-main">
        <strong>
          <StatusBadge status={rec.status} />
        </strong>
        <span className="num">{sub}</span>
      </span>
      {onClick && <ChevronRight size={18} className="muted" aria-hidden="true" />}
    </>
  )
  return onClick ? (
    <button type="button" className="list-btn" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="list-btn" style={{ cursor: 'default' }}>
      {body}
    </div>
  )
}
