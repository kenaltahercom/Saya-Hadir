import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Check, MapPin } from 'lucide-react'
import { Notice, StatusBadge } from '../../components/ui'
import { todayOf, useMe, useNow } from '../../lib/hooks'
import { submitAttendance } from '../../lib/store'
import { fmtClock } from '../../lib/time'
import { resizeImage } from '../../lib/image'
import type { AttemptResult } from '../../lib/attendance'

type Phase = 'idle' | 'selfie' | 'locating' | 'result'
interface Problem {
  title: string
  msg: string
}

const GEO_ERRORS: Record<number, Problem> = {
  1: { title: 'Izin lokasi ditolak', msg: 'Buka pengaturan situs di peramban (ikon gembok di address bar), izinkan Lokasi, lalu coba lagi.' },
  2: { title: 'Lokasi tidak tersedia', msg: 'Pastikan GPS / layanan lokasi di ponsel aktif, lalu coba lagi.' },
  3: { title: 'Sinyal GPS belum didapat', msg: 'Pindah ke area terbuka atau dekat jendela, lalu coba lagi.' },
}

export default function Absen() {
  const { db, emp, sch } = useMe()
  const nowMs = useNow()
  const today = todayOf(db, emp, sch, nowMs)
  const tz = db.company.timezone
  const action: 'in' | 'out' = today.state === 'can_out' ? 'out' : 'in'
  const needSelfie = action === 'in' && db.company.requireSelfie

  const [phase, setPhase] = useState<Phase>('idle')
  const [selfie, setSelfie] = useState<string>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (phase !== 'selfie' || selfie) return
    let cancelled = false
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        streamRef.current = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        if (cancelled) return
        setPhase('idle')
        setProblem({ title: 'Kamera tidak bisa dipakai', msg: 'Izinkan akses kamera di pengaturan situs. Perusahaan Anda mewajibkan foto selfie untuk absen masuk.' })
      }
    })()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [phase, selfie])

  const capture = async () => {
    if (!videoRef.current) return
    try {
      setSelfie(await resizeImage(videoRef.current, 360, 0.65))
    } catch {
      setProblem({ title: 'Foto gagal diambil', msg: 'Coba ambil ulang.' })
    }
  }

  const locate = (photo?: string) => {
    setProblem(null)
    setPhase('locating')
    if (!('geolocation' in navigator)) {
      setPhase('idle')
      return setProblem({ title: 'Peramban tidak mendukung lokasi', msg: 'Buka Saya Hadir lewat peramban ponsel terbaru (Chrome atau Safari) dengan koneksi HTTPS.' })
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const res = submitAttendance(emp.id, action, { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, selfie: photo })
        setResult(res)
        setPhase('result')
      },
      (err) => {
        setPhase('idle')
        setProblem(GEO_ERRORS[err.code] ?? GEO_ERRORS[2])
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const start = () => {
    setProblem(null)
    if (needSelfie && !selfie) setPhase('selfie')
    else locate(selfie)
  }

  const reset = () => {
    setResult(null)
    setSelfie(undefined)
    setProblem(null)
    setPhase('idle')
  }

  const label = action === 'in' ? 'masuk' : 'pulang'

  /* ── Hasil ── */
  if (phase === 'result' && result) {
    if (result.ok) {
      const r = result.record
      return (
        <>
          <section className="result ok" aria-live="polite">
            <div className="row" style={{ color: 'var(--green)' }}>
              <Check size={22} aria-hidden="true" />
              <h1 style={{ fontSize: 18 }}>Absen {label} tercatat</h1>
            </div>
            <p className="num" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {fmtClock(result.action === 'in' ? r.inAt : r.outAt, tz)}
            </p>
            {result.action === 'in' && (
              <div>
                <StatusBadge status={r.status} label={r.status === 'late' ? `Terlambat ${r.lateMinutes} menit` : undefined} />
              </div>
            )}
            <p className="hint">
              {result.distance} m dari {db.office?.name}
              {r.accuracyIn && result.action === 'in' ? ` · akurasi GPS ${r.accuracyIn} m` : ''}
            </p>
          </section>
          <Link to="/app" className="btn btn-lg">
            Kembali ke beranda
          </Link>
        </>
      )
    }
    const retry = ['distance', 'accuracy', 'selfie_required'].includes(result.code)
    return (
      <>
        <section className="result bad" role="alert">
          <h1 style={{ fontSize: 18, color: 'var(--bad)' }}>Absen belum tercatat</h1>
          <p>{result.message}</p>
        </section>
        {retry && (
          <button className="btn btn-primary btn-lg" onClick={reset}>
            Coba lagi
          </button>
        )}
        <Link to="/app" className="btn btn-lg">
          Kembali ke beranda
        </Link>
      </>
    )
  }

  /* ── Tidak bisa absen hari ini ── */
  if (today.state !== 'can_in' && today.state !== 'can_out') {
    const msg: Record<string, string> = {
      done: 'Absensi hari ini sudah lengkap: masuk dan pulang tercatat.',
      not_workday: 'Hari ini bukan hari kerja pada jadwal Anda.',
      no_office: 'Admin belum mengatur lokasi kantor.',
      inactive: 'Akun Anda dinonaktifkan. Hubungi HR.',
      recorded_other: 'Hari ini sudah dicatat oleh admin.',
    }
    return (
      <>
        <h1 className="m-title">Absen</h1>
        <Notice tone="info">{msg[today.state]}</Notice>
        <Link to="/app" className="btn btn-lg">
          Kembali ke beranda
        </Link>
      </>
    )
  }

  /* ── Ambil selfie ── */
  if (phase === 'selfie') {
    return (
      <>
        <div>
          <h1 className="m-title">Foto selfie</h1>
          <p className="m-sub">Wajah terlihat jelas, lalu ambil foto.</p>
        </div>
        <div className="camera">{selfie ? <img src={selfie} alt="Hasil foto selfie" /> : <video ref={videoRef} playsInline muted aria-label="Pratinjau kamera depan" />}</div>
        {selfie ? (
          <div className="stack-sm">
            <button className="btn btn-primary btn-lg" onClick={() => locate(selfie)}>
              Pakai foto ini
            </button>
            <button className="btn btn-block" style={{ minHeight: 48 }} onClick={() => setSelfie(undefined)}>
              Ambil ulang
            </button>
          </div>
        ) : (
          <div className="stack-sm">
            <button className="btn btn-primary btn-lg" onClick={capture}>
              <Camera size={20} aria-hidden="true" />
              Ambil foto
            </button>
            <button className="btn btn-block btn-quiet" onClick={reset}>
              Batal
            </button>
          </div>
        )}
      </>
    )
  }

  /* ── Mencari lokasi ── */
  if (phase === 'locating') {
    return (
      <div className="u-dashboard" style={{ textAlign: 'center', padding: '48px 12px' }}>
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 20px' }}>
          <div className="radar-circle-pulse" />
          <div className="radar-circle-center">
            <MapPin size={34} style={{ color: 'var(--green)' }} />
          </div>
        </div>
        <h1 className="u-greeting" style={{ fontSize: 20 }}>Mencari Lokasi GPS…</h1>
        <p className="u-date-text" style={{ maxWidth: 290, margin: '8px auto 0' }}>
          Tahan layar ini tetap aktif. Sistem sedang memverifikasi posisi Anda terhadap radius {db.office?.name}.
        </p>
      </div>
    )
  }

  /* ── Awal ── */
  return (
    <>
      <div>
        <h1 className="m-title">Absen {label}</h1>
        <p className="m-sub">Waktu resmi dicatat sistem saat Anda menekan tombol.</p>
      </div>

      {problem && (
        <Notice tone="bad" title={problem.title}>
          {problem.msg}
        </Notice>
      )}

      <section className="panel panel-body stack-sm">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <MapPin size={18} style={{ marginTop: 2 }} aria-hidden="true" />
          <div>
            <strong>{db.office?.name}</strong>
            <p className="hint">{db.office?.address}</p>
          </div>
        </div>
        <p className="hint">
          Anda harus berada dalam <b>{db.office?.radius} m</b> dari titik kantor, dengan akurasi GPS maksimal <b>{db.office?.maxAccuracy} m</b>.
        </p>
      </section>

      <ol className="steps" aria-label="Langkah absen">
        {needSelfie && (
          <li className={`step ${selfie ? 'done' : 'active'}`}>
            <span className="step-ico">{selfie ? <Check size={15} /> : <Camera size={15} />}</span>
            <div>
              <b>Foto selfie</b>
              <span>Wajib untuk absen masuk di perusahaan ini.</span>
            </div>
          </li>
        )}
        <li className="step active">
          <span className="step-ico">
            <MapPin size={15} />
          </span>
          <div>
            <b>Lokasi saat ini</b>
            <span>Peramban akan meminta izin lokasi. Hanya dipakai saat absen.</span>
          </div>
        </li>
      </ol>

      <button className="btn btn-primary btn-lg" onClick={start}>
        {needSelfie && !selfie ? 'Lanjut ke foto selfie' : `Absen ${label} sekarang`}
      </button>
    </>
  )
}
