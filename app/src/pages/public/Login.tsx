import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Brand, Field, Notice, Spinner } from '../../components/ui'
import { login, resetDemo, useStore } from '../../lib/store'
import { DEMO_LOGINS, DEMO_PASSWORD } from '../../lib/seed'

export function AuthAside({ title, points }: { title: string; points: string[] }) {
  return (
    <aside className="auth-aside">
      <Link to="/" aria-label="Saya Hadir, beranda">
        <Brand invert />
      </Link>
      <div>
        <h2>{title}</h2>
        <ul>
          {points.map((p) => (
            <li key={p}>
              <Check size={16} aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <p style={{ marginTop: 0 }}>Absensi tervalidasi lokasi kantor, jadwal, dan rekap dalam satu tempat.</p>
    </aside>
  )
}

export default function Login() {
  const { ready, account } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (ready && account) return <Navigate to={account.role === 'karyawan' ? '/app' : '/admin'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Isi email dan kata sandi.')
    setBusy(true)
    try {
      const res = await login(email, password)
      if (!res.ok) return setError(res.error)
      nav(res.account.role === 'karyawan' ? '/app' : '/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const fill = (mail: string) => {
    setEmail(mail)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div className="auth">
      <AuthAside title="Masuk untuk absen atau mengelola kehadiran tim." points={['Karyawan absen dari ponsel di area kantor', 'Owner dan HR mengelola data dari desktop', 'Setiap koreksi tercatat di log audit']} />
      <main className="auth-main">
        <Link to="/" aria-label="Saya Hadir, beranda" style={{ textDecoration: 'none' }}>
          <Brand />
        </Link>
        <div>
          <h1>Masuk</h1>
          <p className="sub">Gunakan email yang didaftarkan perusahaan Anda.</p>
        </div>

        <form className="stack" onSubmit={submit} noValidate>
          {error && <Notice tone="bad">{error}</Notice>}
          <Field label="Email" id="email">
            <input id="email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@perusahaan.com" />
          </Field>
          <Field label="Kata sandi" id="password">
            <div className="pw">
              <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}>
                {show ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </Field>
          <button className="btn btn-primary btn-block" style={{ minHeight: 48 }} disabled={busy}>
            {busy ? <Spinner label="Memeriksa…" /> : 'Masuk'}
          </button>
        </form>

        <div className="demo-box">
          <div className="row between">
            <strong style={{ fontSize: 13 }}>Akun demo</strong>
            <span className="tag-demo">DATA CONTOH</span>
          </div>
          <div className="row wrap">
            {Object.values(DEMO_LOGINS).map((d) => (
              <button key={d.email} type="button" className="btn btn-sm" onClick={() => fill(d.email)}>
                {d.label}
              </button>
            ))}
          </div>
          <p>
            Kata sandi semua akun demo: <b>{DEMO_PASSWORD}</b>. Data tersimpan di peramban ini saja.{' '}
            <button type="button" className="btn-quiet" style={{ border: 0, background: 'none', padding: 0, textDecoration: 'underline', color: 'var(--muted)' }} onClick={() => confirm('Hapus semua data di peramban ini dan kembalikan ke data demo awal?') && resetDemo()}>
              Reset data demo
            </button>
          </p>
        </div>

        <p className="muted">
          Perusahaan belum terdaftar?{' '}
          <Link to="/daftar" style={{ color: 'var(--ink)', fontWeight: 600 }}>
            Daftarkan perusahaan
          </Link>
        </p>
      </main>
    </div>
  )
}
