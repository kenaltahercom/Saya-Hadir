import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Lock, LogOut, ShieldCheck, Trash2 } from 'lucide-react'
import { Avatar, Field, Notice } from '../../components/ui'
import { useToast } from '../../components/toast'
import { useMe } from '../../lib/hooks'
import { resizeImage } from '../../lib/image'
import { changePassword, logout, setEmployeePhoto } from '../../lib/store'
import { DAY_SHORT } from '../../lib/time'

export default function Profil() {
  const { db, account, emp, sch } = useMe()
  const toast = useToast()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pw, setPw] = useState({ old: '', next: '' })
  const [pwErr, setPwErr] = useState('')
  const [pwOpen, setPwOpen] = useState(false)

  const onPhoto = async (file?: File) => {
    if (!file) return
    try {
      setEmployeePhoto(emp.id, await resizeImage(file, 256, 0.8))
      toast('Foto profil diperbarui.')
    } catch {
      toast('Berkas bukan gambar yang valid.', 'bad')
    }
  }

  const savePw = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.next.length < 8) return setPwErr('Kata sandi baru minimal 8 karakter.')
    const err = await changePassword(pw.old, pw.next)
    if (err) return setPwErr(err)
    setPw({ old: '', next: '' })
    setPwErr('')
    setPwOpen(false)
    toast('Kata sandi diganti.')
  }

  const out = () => {
    logout()
    nav('/login', { replace: true })
  }

  return (
    <div className="u-dashboard">
      {/* Profile Header Card */}
      <div className="profile-head" style={{ borderRadius: 20 }}>
        <Avatar name={emp.name} photo={emp.photo} size={64} />
        <div className="grow">
          <h1 className="u-greeting" style={{ fontSize: 20 }}>
            {emp.name}
          </h1>
          <p className="u-date-text">{emp.position} · {emp.department}</p>
        </div>
      </div>

      {/* Photo Actions */}
      <div className="row wrap">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          <Camera size={14} />
          <span>Ganti foto</span>
        </button>
        {emp.photo && (
          <button type="button" className="btn btn-sm btn-quiet" onClick={() => setEmployeePhoto(emp.id, undefined)}>
            <Trash2 size={14} className="text-bad" />
            <span>Hapus foto</span>
          </button>
        )}
      </div>

      {/* Data Kepegawaian Card */}
      <section className="m-section">
        <h2 className="u-section-title">Data Kepegawaian</h2>
        <dl className="defs panel panel-body" style={{ borderRadius: 16 }}>
          <dt>NIP</dt>
          <dd className="num">{emp.nip}</dd>
          <dt>Email</dt>
          <dd>{emp.email}</dd>
          <dt>Departemen</dt>
          <dd>{emp.department}</dd>
          <dt>Jadwal Kerja</dt>
          <dd>{sch ? `${sch.name} (${sch.start}–${sch.end})` : '–'}</dd>
          <dt>Hari Kerja</dt>
          <dd>{sch?.days.map((d) => DAY_SHORT[d]).join(', ')}</dd>
          <dt>Perusahaan</dt>
          <dd>{db.company.name}</dd>
        </dl>
      </section>

      {/* Security Card */}
      <section className="m-section">
        <h2 className="u-section-title">Keamanan & Sandi</h2>
        {pwOpen ? (
          <form className="stack panel panel-body" style={{ borderRadius: 16 }} onSubmit={savePw}>
            {pwErr && <Notice tone="bad">{pwErr}</Notice>}
            <Field label="Kata sandi saat ini" id="old">
              <input
                id="old"
                type="password"
                autoComplete="current-password"
                value={pw.old}
                onChange={(e) => setPw({ ...pw, old: e.target.value })}
              />
            </Field>
            <Field label="Kata sandi baru" id="new" hint="Minimal 8 karakter.">
              <input
                id="new"
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
            </Field>
            <div className="row">
              <button className="btn btn-primary">Simpan Sandi Baru</button>
              <button type="button" className="btn btn-quiet" onClick={() => setPwOpen(false)}>
                Batal
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="btn btn-block"
            style={{ minHeight: 46, borderRadius: 'var(--r-pill)' }}
            onClick={() => setPwOpen(true)}
          >
            <Lock size={15} />
            <span>Ganti kata sandi</span>
          </button>
        )}
      </section>

      {/* Shortcut to Admin if Owner / HR */}
      {account?.role !== 'karyawan' && (
        <Link
          to="/admin"
          className="btn btn-block btn-primary"
          style={{ minHeight: 48, borderRadius: 'var(--r-pill)' }}
        >
          <ShieldCheck size={17} />
          <span>Buka Dashboard Admin HR</span>
        </Link>
      )}

      {/* Logout button */}
      <button
        type="button"
        className="btn btn-block btn-quiet"
        style={{ minHeight: 46, color: 'var(--bad)', borderRadius: 'var(--r-pill)' }}
        onClick={out}
      >
        <LogOut size={16} />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  )
}
