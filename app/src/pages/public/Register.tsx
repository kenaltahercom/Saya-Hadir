import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Brand, Field, Notice, Spinner } from '../../components/ui'
import { registerOwner, useStore } from '../../lib/store'
import { AuthAside } from './Login'

export default function Register() {
  const { ready, account } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', company: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f, string>>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && account) return <Navigate to={account.role === 'karyawan' ? '/app' : '/admin'} replace />

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (f.name.trim().length < 2) next.name = 'Nama wajib diisi.'
    if (f.company.trim().length < 2) next.company = 'Nama perusahaan wajib diisi.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) next.email = 'Format email tidak valid.'
    if (f.password.length < 8) next.password = 'Minimal 8 karakter.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      const res = await registerOwner(f)
      if (!res.ok) return setFormError(res.error)
      nav('/admin/lokasi', { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <AuthAside title="Daftarkan perusahaan, atur lokasi kantor, lalu tambahkan karyawan." points={['Satu akun Owner per perusahaan', 'Radius dan akurasi GPS bisa Anda atur sendiri', 'Data perusahaan terpisah dari perusahaan lain']} />
      <main className="auth-main">
        <Link to="/" aria-label="Saya Hadir, beranda" style={{ textDecoration: 'none' }}>
          <Brand />
        </Link>
        <div>
          <h1>Daftarkan perusahaan</h1>
          <p className="sub">Anda menjadi Owner dan bisa mengundang HR serta karyawan setelahnya.</p>
        </div>
        <form className="stack" onSubmit={submit} noValidate>
          {formError && <Notice tone="bad">{formError}</Notice>}
          <Field label="Nama Anda" id="name" error={errors.name}>
            <input id="name" type="text" autoComplete="name" value={f.name} onChange={set('name')} />
          </Field>
          <Field label="Nama perusahaan" id="company" error={errors.company}>
            <input id="company" type="text" autoComplete="organization" value={f.company} onChange={set('company')} placeholder="PT Contoh Sejahtera" />
          </Field>
          <Field label="Email" id="email" error={errors.email}>
            <input id="email" type="email" autoComplete="username" inputMode="email" value={f.email} onChange={set('email')} />
          </Field>
          <Field label="Kata sandi" id="password" error={errors.password} hint="Minimal 8 karakter.">
            <input id="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} />
          </Field>
          <button className="btn btn-primary btn-block" style={{ minHeight: 48 }} disabled={busy}>
            {busy ? <Spinner label="Membuat akun…" /> : 'Buat akun'}
          </button>
        </form>
        <p className="muted">
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600 }}>
            Masuk
          </Link>
        </p>
      </main>
    </div>
  )
}
