import { useMemo, useState, type FormEvent } from 'react'
import { Download, Plus, Search, Upload } from 'lucide-react'
import { PageHead } from '../../components/shells'
import { useToast } from '../../components/toast'
import { Avatar, Badge, DataTable, Empty, Field, Modal, Notice, type Column } from '../../components/ui'
import { downloadFile, parseCsv, toCsv } from '../../lib/csv'
import { importEmployees, saveEmployee, setEmployeeStatus, useStore, validateEmployee } from '../../lib/store'
import type { DB, Employee } from '../../lib/types'
import { zoned } from '../../lib/time'

/* ───────────── Form tambah / ubah ───────────── */

function EmployeeForm({ db, initial, onClose, onCreated }: { db: DB; initial?: Employee; onClose: () => void; onCreated: (email: string, pw: string) => void }) {
  const toast = useToast()
  const [f, setF] = useState({
    nip: initial?.nip ?? '',
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    department: initial?.department ?? '',
    position: initial?.position ?? '',
    scheduleId: initial?.scheduleId ?? db.schedules.find((s) => s.isDefault)?.id ?? db.schedules[0]?.id ?? '',
    joined: initial?.joined ?? zoned(Date.now(), db.company.timezone).date,
    status: initial?.status ?? ('active' as const),
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const departments = [...new Set(db.employees.map((e) => e.department).filter(Boolean))]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const v = validateEmployee(db, f, initial?.id)
    if (v) return setError(v)
    if (!f.department.trim() || !f.position.trim()) return setError('Departemen dan jabatan wajib diisi.')
    setBusy(true)
    const res = await saveEmployee({ ...f, id: initial?.id, photo: initial?.photo })
    setBusy(false)
    if (res.error) return setError(res.error)
    if (res.tempPassword) onCreated(f.email, res.tempPassword)
    else toast('Perubahan disimpan.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Ubah karyawan' : 'Tambah karyawan'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose} type="button">
            Batal
          </button>
          <button className="btn btn-primary" form="emp-form" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="emp-form" className="stack" onSubmit={submit} noValidate>
        {error && <Notice tone="bad">{error}</Notice>}
        <div className="field-grid two">
          <Field label="NIP" id="nip">
            <input id="nip" type="text" value={f.nip} onChange={set('nip')} placeholder="SH-2026-010" />
          </Field>
          <Field label="Nama lengkap" id="name">
            <input id="name" type="text" value={f.name} onChange={set('name')} />
          </Field>
        </div>
        <Field label="Email (dipakai untuk masuk)" id="email">
          <input id="email" type="email" value={f.email} onChange={set('email')} />
        </Field>
        <div className="field-grid two">
          <Field label="Departemen" id="dept">
            <input id="dept" type="text" list="dept-list" value={f.department} onChange={set('department')} />
            <datalist id="dept-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label="Jabatan" id="pos">
            <input id="pos" type="text" value={f.position} onChange={set('position')} />
          </Field>
        </div>
        <div className="field-grid two">
          <Field label="Jadwal kerja" id="sch">
            <select id="sch" value={f.scheduleId} onChange={set('scheduleId')}>
              {db.schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start}–{s.end})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tanggal bergabung" id="joined">
            <input id="joined" type="date" value={f.joined} onChange={set('joined')} />
          </Field>
        </div>
        {initial && (
          <Field label="Status" id="status" hint="Karyawan nonaktif tidak bisa masuk atau absen. Riwayatnya tetap tersimpan.">
            <select id="status" value={f.status} onChange={set('status')}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </Field>
        )}
      </form>
    </Modal>
  )
}

/* ───────────── Impor CSV ───────────── */

const HEADERS: Record<string, string[]> = {
  nip: ['nip'],
  name: ['nama', 'name'],
  email: ['email'],
  department: ['departemen', 'department'],
  position: ['jabatan', 'position'],
  schedule: ['jadwal', 'schedule'],
  joined: ['tanggal_bergabung', 'joined'],
}

interface ParsedRow {
  line: number
  data: Omit<Employee, 'id'>
  error?: string
}

function parseEmployees(text: string, db: DB): { rows: ParsedRow[]; fatal?: string } {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], fatal: 'Berkas kosong atau hanya berisi header.' }
  const head = table[0].map((h) => h.trim().toLowerCase())
  const idx = (k: string) => head.findIndex((h) => HEADERS[k].includes(h))
  const missing = ['nip', 'name', 'email', 'department', 'position'].filter((k) => idx(k) < 0)
  if (missing.length) return { rows: [], fatal: `Kolom wajib tidak ditemukan: ${missing.map((m) => HEADERS[m][0]).join(', ')}.` }
  const seenNip = new Set<string>()
  const seenEmail = new Set<string>()
  const defaultSch = db.schedules.find((s) => s.isDefault) ?? db.schedules[0]
  const today = zoned(Date.now(), db.company.timezone).date
  const rows = table.slice(1).map((cells, i): ParsedRow => {
    const get = (k: string) => (idx(k) >= 0 ? (cells[idx(k)] ?? '').trim() : '')
    const schName = get('schedule')
    const sch = schName ? db.schedules.find((s) => s.name.toLowerCase() === schName.toLowerCase()) : defaultSch
    const data = { nip: get('nip'), name: get('name'), email: get('email'), department: get('department'), position: get('position'), status: 'active' as const, joined: get('joined') || today, scheduleId: sch?.id ?? '' }
    let error = validateEmployee(db, data) ?? undefined
    if (!error && (!data.department || !data.position)) error = 'Departemen dan jabatan wajib diisi.'
    if (!error && schName && !sch) error = `Jadwal “${schName}” tidak ada.`
    if (!error && !/^\d{4}-\d{2}-\d{2}$/.test(data.joined)) error = 'Tanggal bergabung harus berformat YYYY-MM-DD.'
    if (!error && (seenNip.has(data.nip.toLowerCase()) || seenEmail.has(data.email.toLowerCase()))) error = 'NIP/email dobel di dalam berkas.'
    seenNip.add(data.nip.toLowerCase())
    seenEmail.add(data.email.toLowerCase())
    return { line: i + 2, data, error }
  })
  return { rows }
}

function ImportDialog({ db, onClose }: { db: DB; onClose: () => void }) {
  const toast = useToast()
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; fatal?: string; file: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ count: number; accounts: { name: string; email: string; tempPassword: string }[] } | null>(null)
  const valid = parsed?.rows.filter((r) => !r.error) ?? []
  const bad = parsed?.rows.filter((r) => r.error) ?? []

  const onFile = async (file?: File) => {
    if (!file) return
    setParsed({ ...parseEmployees(await file.text(), db), file: file.name })
  }
  const run = async () => {
    setBusy(true)
    const res = await importEmployees(valid.map((r) => r.data))
    setBusy(false)
    setDone(res)
    toast(`${res.count} karyawan diimpor.`)
  }

  if (done) {
    return (
      <Modal title="Impor selesai" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Selesai</button>}>
        <div className="stack">
          <Notice tone="ok" title={`${done.count} karyawan ditambahkan`}>
            Akun login dibuat untuk {done.accounts.length} orang. Kata sandi sementara hanya ditampilkan sekali ini.
          </Notice>
          {done.accounts.length > 0 && (
            <button className="btn" onClick={() => downloadFile('akun-sementara.csv', toCsv([['nama', 'email', 'kata_sandi_sementara'], ...done.accounts.map((a) => [a.name, a.email, a.tempPassword])]))}>
              <Download size={16} aria-hidden="true" />
              Unduh daftar kata sandi sementara
            </button>
          )}
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Impor karyawan dari CSV"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" disabled={!valid.length || busy} onClick={run}>
            {busy ? 'Mengimpor…' : `Impor ${valid.length} baris valid`}
          </button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">
          Kolom wajib: <b>nip, nama, email, departemen, jabatan</b>. Opsional: jadwal (nama jadwal), tanggal_bergabung (YYYY-MM-DD). Tidak ada data yang disimpan sebelum Anda menekan tombol impor.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Pilih berkas CSV" />
        {parsed?.fatal && <Notice tone="bad">{parsed.fatal}</Notice>}
        {parsed && !parsed.fatal && (
          <>
            <p>
              <b>{parsed.file}</b>: {valid.length} baris valid, {bad.length} bermasalah (dilewati).
            </p>
            <div className="import-preview">
              <table className="table">
                <thead>
                  <tr>
                    <th>Baris</th>
                    <th>NIP</th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Hasil</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => (
                    <tr key={r.line}>
                      <td className="num">{r.line}</td>
                      <td>{r.data.nip}</td>
                      <td>{r.data.name}</td>
                      <td>{r.data.email}</td>
                      <td>{r.error ? <Badge tone="bad">{r.error}</Badge> : <Badge tone="ok">Siap diimpor</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ───────────── Halaman ───────────── */

export default function Karyawan() {
  const { db } = useStore()
  const d = db!
  const toast = useToast()
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<{ emp?: Employee } | null>(null)
  const [importing, setImporting] = useState(false)
  const [created, setCreated] = useState<{ email: string; pw: string } | null>(null)
  const [confirm, setConfirm] = useState<Employee | null>(null)

  const depts = [...new Set(d.employees.map((e) => e.department))].sort()
  const schName = (id: string) => d.schedules.find((s) => s.id === id)?.name ?? '–'

  const rows = useMemo(
    () =>
      d.employees.filter((e) => {
        const text = `${e.name} ${e.nip} ${e.email}`.toLowerCase()
        return (!q || text.includes(q.toLowerCase())) && (!dept || e.department === dept) && (!status || e.status === status)
      }),
    [d.employees, q, dept, status],
  )

  const exportCsv = () => {
    downloadFile('karyawan.csv', toCsv([['nip', 'nama', 'email', 'departemen', 'jabatan', 'jadwal', 'status', 'tanggal_bergabung'], ...rows.map((e) => [e.nip, e.name, e.email, e.department, e.position, schName(e.scheduleId), e.status === 'active' ? 'aktif' : 'nonaktif', e.joined])]))
  }
  const template = () => downloadFile('template-karyawan.csv', toCsv([['nip', 'nama', 'email', 'departemen', 'jabatan', 'jadwal', 'tanggal_bergabung'], ['SH-2026-001', 'Nama Karyawan', 'nama@perusahaan.com', 'Operasional', 'Staf', d.schedules[0]?.name ?? '', '2026-01-05']]))

  const cols: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Karyawan',
      sort: (a, b) => a.name.localeCompare(b.name),
      render: (e) => (
        <div className="cell-person">
          <Avatar name={e.name} photo={e.photo} size={34} />
          <div>
            <strong>{e.name}</strong>
            <small>{e.email}</small>
          </div>
        </div>
      ),
    },
    { key: 'nip', header: 'NIP', sort: (a, b) => a.nip.localeCompare(b.nip), render: (e) => <span className="num">{e.nip}</span> },
    {
      key: 'dept',
      header: 'Departemen',
      sort: (a, b) => a.department.localeCompare(b.department),
      render: (e) => (
        <>
          {e.department}
          <small className="muted" style={{ display: 'block' }}>
            {e.position}
          </small>
        </>
      ),
    },
    { key: 'sch', header: 'Jadwal', render: (e) => schName(e.scheduleId) },
    { key: 'status', header: 'Status', render: (e) => (e.status === 'active' ? <Badge tone="ok">Aktif</Badge> : <Badge>Nonaktif</Badge>) },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={() => setForm({ emp: e })}>
            Ubah
          </button>
          <button className="btn btn-sm btn-quiet" onClick={() => (e.status === 'active' ? setConfirm(e) : (setEmployeeStatus(e.id, 'active'), toast(`${e.name} diaktifkan.`)))}>
            {e.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Karyawan"
        desc={`${d.employees.filter((e) => e.status === 'active').length} aktif dari ${d.employees.length} terdaftar`}
        actions={
          <>
            <button className="btn btn-sm" onClick={template}>
              Template CSV
            </button>
            <button className="btn btn-sm" onClick={() => setImporting(true)}>
              <Upload size={15} aria-hidden="true" />
              Impor CSV
            </button>
            <button className="btn btn-sm" onClick={exportCsv} disabled={!rows.length}>
              <Download size={15} aria-hidden="true" />
              Ekspor
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setForm({})}>
              <Plus size={15} aria-hidden="true" />
              Tambah karyawan
            </button>
          </>
        }
      />

      <section className="panel">
        <div className="toolbar">
          <div className="field grow search">
            <label htmlFor="q" className="sr-only">
              Cari karyawan
            </label>
            <Search size={16} aria-hidden="true" />
            <input id="q" type="search" placeholder="Cari nama, NIP, atau email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="fd">Departemen</label>
            <select id="fd" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">Semua</option>
              {depts.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="fs">Status</label>
            <select id="fs" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
        <DataTable
          caption="Daftar karyawan"
          columns={cols}
          rows={rows}
          rowKey={(e) => e.id}
          empty={
            <div className="panel-body">
              <Empty
                title={d.employees.length ? 'Tidak ada karyawan yang cocok' : 'Belum ada karyawan'}
                action={!d.employees.length && <button className="btn btn-primary" onClick={() => setForm({})}>Tambah karyawan pertama</button>}
              >
                {d.employees.length ? 'Ubah kata kunci atau filter.' : 'Tambahkan satu per satu atau impor dari CSV.'}
              </Empty>
            </div>
          }
        />
      </section>

      {form && <EmployeeForm db={d} initial={form.emp} onClose={() => setForm(null)} onCreated={(email, pw) => setCreated({ email, pw })} />}
      {importing && <ImportDialog db={d} onClose={() => setImporting(false)} />}

      {confirm && (
        <Modal
          title="Nonaktifkan karyawan?"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                className="btn btn-dark"
                onClick={() => {
                  setEmployeeStatus(confirm.id, 'inactive')
                  toast(`${confirm.name} dinonaktifkan.`)
                  setConfirm(null)
                }}
              >
                Nonaktifkan
              </button>
            </>
          }
        >
          <p>
            <b>{confirm.name}</b> tidak akan bisa masuk atau absen lagi. Seluruh riwayat absensinya tetap tersimpan dan bisa diaktifkan kembali kapan saja.
          </p>
        </Modal>
      )}

      {created && (
        <Modal title="Akun karyawan dibuat" onClose={() => setCreated(null)} footer={<button className="btn btn-primary" onClick={() => setCreated(null)}>Saya sudah mencatat</button>}>
          <div className="stack">
            <p>
              Sampaikan kata sandi sementara ini ke <b>{created.email}</b>. Kata sandi hanya ditampilkan sekali; karyawan bisa menggantinya dari menu Profil.
            </p>
            <div className="copybox">{created.pw}</div>
          </div>
        </Modal>
      )}
    </>
  )
}
