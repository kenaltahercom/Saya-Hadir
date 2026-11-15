import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { PageHead } from '../../components/shells'
import { useToast } from '../../components/toast'
import { Badge, DataTable, Field, Modal, Notice, type Column } from '../../components/ui'
import { deleteSchedule, saveSchedule, useStore } from '../../lib/store'
import type { Schedule } from '../../lib/types'
import { DAY_SHORT, toMinutes } from '../../lib/time'

const ORDER = [1, 2, 3, 4, 5, 6, 0]

function addMin(hhmm: string, n: number) {
  const m = toMinutes(hhmm) + n
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function ScheduleForm({ initial, onClose }: { initial?: Schedule; onClose: () => void }) {
  const toast = useToast()
  const [f, setF] = useState({ name: initial?.name ?? '', days: initial?.days ?? [1, 2, 3, 4, 5], start: initial?.start ?? '08:00', end: initial?.end ?? '17:00', tolerance: initial?.tolerance ?? 15, isDefault: initial?.isDefault ?? false })
  const [error, setError] = useState('')

  const toggle = (d: number) => setF((s) => ({ ...s, days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d].sort() }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) return setError('Nama jadwal wajib diisi.')
    if (!f.days.length) return setError('Pilih minimal satu hari kerja.')
    if (!f.start || !f.end) return setError('Jam masuk dan pulang wajib diisi.')
    if (toMinutes(f.end) <= toMinutes(f.start)) return setError('Jam pulang harus setelah jam masuk. Shift lintas tengah malam belum didukung.')
    if (!Number.isFinite(f.tolerance) || f.tolerance < 0 || f.tolerance > 120) return setError('Toleransi harus antara 0 dan 120 menit.')
    if (initial?.isDefault && !f.isDefault) return setError('Harus ada satu jadwal default. Jadikan jadwal lain default untuk memindahkannya.')
    if (!saveSchedule({ ...f, name: f.name.trim(), id: initial?.id })) return setError('Gagal menyimpan ke penyimpanan peramban.')
    toast('Jadwal disimpan.')
    onClose()
  }

  return (
    <Modal
      title={initial ? 'Ubah jadwal' : 'Tambah jadwal'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" form="sch-form">
            Simpan
          </button>
        </>
      }
    >
      <form id="sch-form" className="stack" onSubmit={submit} noValidate>
        {error && <Notice tone="bad">{error}</Notice>}
        <Field label="Nama jadwal" id="sname">
          <input id="sname" type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Reguler kantor" />
        </Field>
        <div className="field">
          <span className="label" id="days-label">
            Hari kerja
          </span>
          <div className="chips" role="group" aria-labelledby="days-label">
            {ORDER.map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={f.days.includes(d)} onClick={() => toggle(d)}>
                {DAY_SHORT[d]}
              </button>
            ))}
          </div>
        </div>
        <div className="field-grid two">
          <Field label="Jam masuk" id="sin">
            <input id="sin" type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          </Field>
          <Field label="Jam pulang" id="sout">
            <input id="sout" type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
          </Field>
        </div>
        <Field label="Toleransi keterlambatan (menit)" id="stol" hint={f.start ? `Masuk sampai ${addMin(f.start, Number(f.tolerance) || 0)} dianggap tepat waktu. Lewat dari itu terlambat, dihitung dari ${f.start}.` : undefined}>
          <input id="stol" type="number" min={0} max={120} value={f.tolerance} onChange={(e) => setF({ ...f, tolerance: Number(e.target.value) })} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} />
          <span>
            Jadikan jadwal default
            <small>Dipakai untuk karyawan baru yang tidak diberi jadwal khusus.</small>
          </span>
        </label>
      </form>
    </Modal>
  )
}

export default function Jadwal() {
  const { db } = useStore()
  const d = db!
  const toast = useToast()
  const [form, setForm] = useState<{ s?: Schedule } | null>(null)
  const [del, setDel] = useState<Schedule | null>(null)
  const [delError, setDelError] = useState('')
  const used = (id: string) => d.employees.filter((e) => e.scheduleId === id && e.status === 'active').length

  const cols: Column<Schedule>[] = [
    {
      key: 'name',
      header: 'Jadwal',
      render: (s) => (
        <div className="row">
          <strong>{s.name}</strong>
          {s.isDefault && <Badge tone="ok">Default</Badge>}
        </div>
      ),
    },
    {
      key: 'days',
      header: 'Hari kerja',
      render: (s) => ORDER.filter((x) => s.days.includes(x)).map((x) => DAY_SHORT[x]).join(', '),
    },
    { key: 'time', header: 'Jam', render: (s) => <span className="num">{s.start}–{s.end}</span> },
    { key: 'tol', header: 'Toleransi', render: (s) => <span className="num">{s.tolerance} menit</span> },
    { key: 'used', header: 'Karyawan aktif', align: 'right', render: (s) => <span className="num">{used(s.id)}</span> },
    {
      key: 'act',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={() => setForm({ s })}>
            Ubah
          </button>
          <button className="btn btn-sm btn-quiet" onClick={() => (setDelError(''), setDel(s))}>
            Hapus
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHead
        title="Jadwal kerja"
        desc="Hari kerja, jam, dan toleransi. Karyawan diberi jadwal di menu Karyawan."
        actions={
          <button className="btn btn-sm btn-primary" onClick={() => setForm({})}>
            <Plus size={15} aria-hidden="true" />
            Tambah jadwal
          </button>
        }
      />
      <section className="panel">
        <DataTable caption="Daftar jadwal kerja" columns={cols} rows={d.schedules} rowKey={(s) => s.id} empty={<div className="panel-body muted">Belum ada jadwal.</div>} />
      </section>
      <Notice title="Cara status dihitung">
        Absen masuk sampai jam masuk + toleransi dianggap <b>tepat waktu</b>. Lebih dari itu <b>terlambat</b>, dan menit keterlambatan dihitung dari jam masuk. Absen pada hari di luar hari kerja ditolak. Perubahan jadwal hanya berlaku untuk absensi berikutnya; catatan lama tidak dihitung ulang.
      </Notice>

      {form && <ScheduleForm initial={form.s} onClose={() => setForm(null)} />}

      {del && (
        <Modal
          title="Hapus jadwal?"
          onClose={() => setDel(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDel(null)}>
                Batal
              </button>
              <button
                className="btn btn-dark"
                onClick={() => {
                  const err = deleteSchedule(del.id)
                  if (err) return setDelError(err)
                  toast('Jadwal dihapus.')
                  setDel(null)
                }}
              >
                Hapus
              </button>
            </>
          }
        >
          <div className="stack">
            {delError && <Notice tone="bad">{delError}</Notice>}
            <p>
              Jadwal <b>{del.name}</b> akan dihapus permanen.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
