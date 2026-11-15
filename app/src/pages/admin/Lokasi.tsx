import { useState, type FormEvent } from 'react'
import { MapPin } from 'lucide-react'
import { PageHead } from '../../components/shells'
import { useToast } from '../../components/toast'
import { Field, Notice } from '../../components/ui'
import { saveCompany, saveOffice, useStore } from '../../lib/store'

export default function Lokasi() {
  const { db } = useStore()
  const d = db!
  const toast = useToast()
  const o = d.office
  const [f, setF] = useState({
    companyName: d.company.name,
    industry: d.company.industry,
    requireSelfie: d.company.requireSelfie,
    name: o?.name ?? '',
    address: o?.address ?? '',
    lat: o ? String(o.lat) : '',
    lng: o ? String(o.lng) : '',
    radius: o?.radius ?? 150,
    maxAccuracy: o?.maxAccuracy ?? 100,
  })
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')

  const useMyLocation = () => {
    setGeoMsg('')
    if (!('geolocation' in navigator)) return setGeoMsg('Peramban tidak mendukung lokasi.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((s) => ({ ...s, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }))
        setGeoMsg(`Terisi dari perangkat ini (akurasi ${Math.round(p.coords.accuracy)} m). Perangkat desktop biasanya kurang akurat; gunakan ponsel di kantor bila perlu.`)
        setLocating(false)
      },
      () => {
        setGeoMsg('Lokasi tidak bisa diambil. Izinkan akses lokasi atau isi koordinat manual.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const lat = Number(f.lat)
    const lng = Number(f.lng)
    if (f.companyName.trim().length < 2) return setError('Nama perusahaan wajib diisi.')
    if (!f.name.trim()) return setError('Nama titik kantor wajib diisi.')
    if (f.lat === '' || f.lng === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return setError('Koordinat tidak valid. Latitude −90 sampai 90, longitude −180 sampai 180.')
    if (f.radius < 30 || f.radius > 1000) return setError('Radius harus antara 30 dan 1000 meter.')
    if (f.maxAccuracy < 10 || f.maxAccuracy > 500) return setError('Batas akurasi harus antara 10 dan 500 meter.')
    setError('')
    const ok1 = saveCompany({ name: f.companyName.trim(), industry: f.industry.trim(), requireSelfie: f.requireSelfie })
    const ok2 = saveOffice({ name: f.name.trim(), address: f.address.trim(), lat, lng, radius: f.radius, maxAccuracy: f.maxAccuracy })
    if (ok1 && ok2) toast('Pengaturan disimpan.')
    else setError('Gagal menyimpan ke penyimpanan peramban.')
  }

  const hasPoint = f.lat !== '' && f.lng !== '' && Number.isFinite(Number(f.lat)) && Number.isFinite(Number(f.lng))

  return (
    <>
      <PageHead title="Lokasi & aturan" desc="Titik kantor dan batas yang dipakai untuk menerima atau menolak absensi." />
      {!o && <Notice tone="warn" title="Lokasi kantor belum diatur">Karyawan belum bisa absen sampai bagian “Lokasi kantor” di bawah disimpan.</Notice>}

      <form className="stack" onSubmit={submit} noValidate style={{ maxWidth: 760 }}>
        {error && <Notice tone="bad">{error}</Notice>}

        <section className="panel">
          <div className="panel-head">
            <h2>Perusahaan</h2>
          </div>
          <div className="panel-body stack">
            <div className="field-grid two">
              <Field label="Nama perusahaan" id="cn">
                <input id="cn" type="text" value={f.companyName} onChange={(e) => setF({ ...f, companyName: e.target.value })} />
              </Field>
              <Field label="Bidang usaha" id="ci">
                <input id="ci" type="text" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
              </Field>
            </div>
            <Field label="Zona waktu" id="tz" hint="Saat ini hanya WIB. Dukungan WITA/WIT menunggu backend.">
              <input id="tz" type="text" value="WIB (Asia/Jakarta)" disabled />
            </Field>
            <label className="check">
              <input type="checkbox" checked={f.requireSelfie} onChange={(e) => setF({ ...f, requireSelfie: e.target.checked })} />
              <span>
                Wajibkan foto selfie saat absen masuk
                <small>Foto disimpan bersama catatan dan bisa dilihat di rekap. Ini bukan verifikasi wajah otomatis.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Lokasi kantor</h2>
            <button type="button" className="btn btn-sm" onClick={useMyLocation} disabled={locating}>
              <MapPin size={15} aria-hidden="true" />
              {locating ? 'Mencari…' : 'Pakai lokasi perangkat ini'}
            </button>
          </div>
          <div className="panel-body stack">
            {geoMsg && <Notice>{geoMsg}</Notice>}
            <Field label="Nama titik" id="on">
              <input id="on" type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Kantor pusat" />
            </Field>
            <Field label="Alamat" id="oa">
              <input id="oa" type="text" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </Field>
            <div className="field-grid two">
              <Field label="Latitude" id="lat">
                <input id="lat" type="text" inputMode="decimal" value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} placeholder="-6.225500" />
              </Field>
              <Field label="Longitude" id="lng">
                <input id="lng" type="text" inputMode="decimal" value={f.lng} onChange={(e) => setF({ ...f, lng: e.target.value })} placeholder="106.831500" />
              </Field>
            </div>
            {hasPoint && (
              <a href={`https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lng}#map=18/${f.lat}/${f.lng}`} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                Cek titik ini di peta
              </a>
            )}
            <div className="field-grid two">
              <Field label={`Radius absensi: ${f.radius} m`} id="rad" hint="Jarak maksimal dari titik kantor. Nilai awal 150 m adalah uji coba; sesuaikan setelah dicoba di lapangan.">
                <input id="rad" className="range" type="range" min={30} max={500} step={10} value={f.radius} onChange={(e) => setF({ ...f, radius: Number(e.target.value) })} />
              </Field>
              <Field label={`Akurasi GPS maksimal: ${f.maxAccuracy} m`} id="acc" hint="Absen ditolak bila perangkat melaporkan akurasi lebih buruk dari ini.">
                <input id="acc" className="range" type="range" min={20} max={200} step={10} value={f.maxAccuracy} onChange={(e) => setF({ ...f, maxAccuracy: Number(e.target.value) })} />
              </Field>
            </div>
          </div>
        </section>

        <div className="row">
          <button className="btn btn-primary">Simpan pengaturan</button>
        </div>
      </form>
    </>
  )
}
