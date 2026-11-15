import { useMemo, useState, type FormEvent } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { PageHead } from '../../components/shells'
import { useToast } from '../../components/toast'
import { Avatar, Badge, DataTable, Empty, Field, Modal, Notice, StatusBadge, type Column } from '../../components/ui'
import { downloadFile, toCsv } from '../../lib/csv'
import { correctAttendance, useStore } from '../../lib/store'
import { STATUS_LABEL, type AttStatus, type Attendance, type DB, type Employee } from '../../lib/types'
import { addDays, fmtClock, fmtDate, fmtDateTime, fmtDuration, zoned } from '../../lib/time'

interface Row extends Attendance {
  emp: Employee
}

function CorrectionDialog({ db, target, onClose }: { db: DB; target?: Row; onClose: () => void }) {
  const toast = useToast()
  const tz = db.company.timezone
  const [f, setF] = useState({
    employeeId: target?.employeeId ?? db.employees.find((e) => e.status === 'active')?.id ?? '',
    date: target?.date ?? zoned(Date.now(), tz).date,
    status: (target?.status ?? 'ontime') as AttStatus,
    inTime: target?.inAt ? fmtClock(target.inAt, tz) : '',
    outTime: target?.outAt ? fmtClock(target.outAt, tz) : '',
    reason: '',
  })
  const [error, setError] = useState('')
  const worked = f.status === 'ontime' || f.status === 'late'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = correctAttendance(f)
    if (err) return setError(err)
    toast(target ? 'Koreksi disimpan dan dicatat di log audit.' : 'Absensi manual dicatat.')
    onClose()
  }

  return (
    <Modal
      title={target ? 'Koreksi absensi' : 'Catat absensi manual'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" form="cor-form">
            Simpan
          </button>
        </>
      }
    >
      <form id="cor-form" className="stack" onSubmit={submit} noValidate>
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="field-grid two">
          <Field label="Karyawan" id="cemp">
            <select id="cemp" value={f.employeeId} disabled={!!target} onChange={(e) => setF({ ...f, employeeId: e.target.value })}>
              {db.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tanggal" id="cdate">
            <input id="cdate" type="date" value={f.date} max={zoned(Date.now(), tz).date} disabled={!!target} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
        </div>
        <Field label="Status" id="cstatus">
          <select id="cstatus" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as AttStatus })}>
            {(Object.keys(STATUS_LABEL) as AttStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        {worked && (
          <div className="field-grid two">
            <Field label="Jam masuk" id="cin">
              <input id="cin" type="time" value={f.inTime} onChange={(e) => setF({ ...f, inTime: e.target.value })} />
            </Field>
            <Field label="Jam pulang (opsional)" id="cout">
              <input id="cout" type="time" value={f.outTime} onChange={(e) => setF({ ...f, outTime: e.target.value })} />
            </Field>
          </div>
        )}
        <Field label="Alasan koreksi" id="creason" hint="Wajib. Tersimpan di log audit bersama nama Anda dan nilai sebelum–sesudah.">
          <textarea id="creason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Contoh: kendala GPS, dinas luar kantor dengan surat tugas" />
        </Field>
        {target?.selfie && (
          <div>
            <p className="label" style={{ marginBottom: 6 }}>
              Foto selfie saat absen masuk
            </p>
            <div className="camera" style={{ maxWidth: 160 }}>
              <img src={target.selfie} alt="Selfie absen masuk" />
            </div>
          </div>
        )}
        {target?.correction && <p className="hint">Terakhir dikoreksi oleh {target.correction.by}, {fmtDateTime(target.correction.at, tz)}.</p>}
      </form>
    </Modal>
  )
}

export default function Rekap() {
  const { db } = useStore()
  const d = db!
  const tz = d.company.timezone
  const today = zoned(Date.now(), tz).date
  const [from, setFrom] = useState(addDays(today, -29))
  const [to, setTo] = useState(today)
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [dialog, setDialog] = useState<{ row?: Row } | null>(null)

  const rows: Row[] = useMemo(() => {
    const byId = new Map(d.employees.map((e) => [e.id, e]))
    return d.attendance
      .flatMap((a) => {
        const emp = byId.get(a.employeeId)
        return emp ? [{ ...a, emp }] : []
      })
      .filter((r) => r.date >= from && r.date <= to && (!dept || r.emp.department === dept) && (!status || r.status === status) && (!q || `${r.emp.name} ${r.emp.nip}`.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => b.date.localeCompare(a.date) || a.emp.name.localeCompare(b.emp.name))
  }, [d.attendance, d.employees, from, to, dept, status, q])

  const depts = [...new Set(d.employees.map((e) => e.department))].sort()
  const tally = (s: AttStatus) => rows.filter((r) => r.status === s).length

  const exportCsv = () =>
    downloadFile(
      `rekap-absensi_${from}_${to}.csv`,
      toCsv([
        ['tanggal', 'nip', 'nama', 'departemen', 'masuk', 'pulang', 'durasi', 'status', 'menit_terlambat', 'jarak_masuk_m', 'dikoreksi', 'alasan_koreksi'],
        ...rows.map((r) => [r.date, r.emp.nip, r.emp.name, r.emp.department, r.inAt ? fmtClock(r.inAt, tz) : '', r.outAt ? fmtClock(r.outAt, tz) : '', fmtDuration(r.inAt, r.outAt).replace('–', ''), STATUS_LABEL[r.status], r.lateMinutes, r.distanceIn, r.correction ? 'ya' : 'tidak', r.correction?.reason]),
      ]),
    )

  const cols: Column<Row>[] = [
    { key: 'date', header: 'Tanggal', sort: (a, b) => a.date.localeCompare(b.date), render: (r) => <span className="num">{fmtDate(r.date)}</span> },
    {
      key: 'name',
      header: 'Karyawan',
      sort: (a, b) => a.emp.name.localeCompare(b.emp.name),
      render: (r) => (
        <div className="cell-person">
          <Avatar name={r.emp.name} photo={r.emp.photo} size={30} />
          <div>
            <strong>{r.emp.name}</strong>
            <small>{r.emp.nip}</small>
          </div>
        </div>
      ),
    },
    { key: 'in', header: 'Masuk', render: (r) => <span className="num">{fmtClock(r.inAt, tz)}</span> },
    { key: 'out', header: 'Pulang', render: (r) => <span className="num">{fmtClock(r.outAt, tz)}</span> },
    { key: 'dur', header: 'Durasi', render: (r) => <span className="num">{fmtDuration(r.inAt, r.outAt)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="row wrap" style={{ gap: 6 }}>
          <StatusBadge status={r.status} label={r.status === 'late' ? `Terlambat ${r.lateMinutes} m` : undefined} />
          {r.correction && <Badge>Dikoreksi</Badge>}
        </div>
      ),
    },
    { key: 'dist', header: 'Jarak', align: 'right', render: (r) => <span className="num muted">{r.distanceIn !== undefined ? `${r.distanceIn} m` : '–'}</span> },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (r) => (
        <button className="btn btn-sm" onClick={() => setDialog({ row: r })}>
          Koreksi
        </button>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Rekap absensi"
        desc="Semua catatan absensi. Ekspor mengikuti filter yang sedang aktif."
        actions={
          <>
            <button className="btn btn-sm" onClick={exportCsv} disabled={!rows.length}>
              <Download size={15} aria-hidden="true" />
              Ekspor CSV
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setDialog({})} disabled={!d.employees.length}>
              <Plus size={15} aria-hidden="true" />
              Catat manual
            </button>
          </>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <div className="field">
            <label htmlFor="rf">Dari</label>
            <input id="rf" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rt">Sampai</label>
            <input id="rt" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rd">Departemen</label>
            <select id="rd" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">Semua</option>
              {depts.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rs">Status</label>
            <select id="rs" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              {(Object.keys(STATUS_LABEL) as AttStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field grow search">
            <label htmlFor="rq" className="sr-only">
              Cari
            </label>
            <Search size={16} aria-hidden="true" />
            <input id="rq" type="search" placeholder="Cari nama atau NIP" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="toolbar tally" style={{ alignItems: 'center', padding: '10px 18px' }}>
          <span>
            <b className="num">{rows.length}</b>catatan
          </span>
          <span>
            <b className="num">{tally('ontime')}</b>tepat waktu
          </span>
          <span>
            <b className="num">{tally('late')}</b>terlambat
          </span>
          <span>
            <b className="num">{tally('leave')}</b>izin / cuti
          </span>
          <span>
            <b className="num">{tally('absent')}</b>tidak hadir
          </span>
        </div>
        <DataTable
          caption="Rekap absensi"
          columns={cols}
          rows={rows}
          rowKey={(r) => r.id}
          pageSize={12}
          initialSort={{ key: 'date', dir: 'desc' }}
          empty={
            <div className="panel-body">
              <Empty title="Tidak ada catatan pada filter ini">Perluas rentang tanggal atau hapus filter. Hari tanpa catatan tidak otomatis dianggap tidak hadir.</Empty>
            </div>
          }
        />
      </section>
      {dialog && <CorrectionDialog db={d} target={dialog.row} onClose={() => setDialog(null)} />}
    </>
  )
}
