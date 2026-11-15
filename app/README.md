# Saya Hadir — frontend

React 19 + Vite + TypeScript. Dua pengalaman dalam satu aplikasi:

| Area | Alamat | Perangkat utama | Isi |
|---|---|---|---|
| Karyawan | `/app` | Ponsel | Beranda, Absen (GPS + selfie opsional), Riwayat, Profil |
| Owner / HR | `/admin` | Desktop | Ringkasan, Karyawan, Jadwal kerja, Rekap absensi, Lokasi & aturan, Log audit |

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
```

Geolocation dan kamera hanya bekerja di `localhost` atau HTTPS. Untuk mencoba dari ponsel, deploy ke Vercel (rewrite SPA sudah ada di `vercel.json`).

## Akun demo (data contoh, ditandai di UI)

Kata sandi semua akun: `demo1234`

- `andi@perusahaan.com` — Karyawan (hari ini sengaja dikosongkan agar alur absen bisa dicoba)
- `siti@perusahaan.com` — HR
- `admin@sayahadir.com` — Owner

Untuk mencoba absen di luar kantor Jakarta: login Owner → Lokasi & aturan → **Pakai lokasi perangkat ini** → simpan.
Untuk melihat sisi admin dan karyawan bersamaan: buka dua tab. Perubahan tersinkron lewat event `storage`.

## Struktur

```
src/
  lib/          types, time, attendance (aturan validasi, murni), seed (data demo), store (data lokal), csv, image
  components/   ui (primitif), shells (shell mobile & admin + route guard), toast, dayrow
  pages/public  Landing, Login, Register
  pages/app     Beranda, Absen, Riwayat, Profil          ← mobile-first
  pages/admin   Ringkasan, Karyawan, Jadwal, Rekap, Lokasi, Audit  ← desktop-first
  styles/app.css  token + komponen (tanpa teks biru, tanpa gradient dekoratif)
```

## Batas yang jujur

- **Data tersimpan di localStorage per-peramban.** Admin di desktop dan karyawan di ponsel baru berbagi data setelah `src/lib/store.ts` disambungkan ke Supabase. Seluruh halaman hanya memakai fungsi dari file itu, jadi UI tidak perlu diubah.
- `evaluate()` di `lib/attendance.ts` adalah aturan keputusan absensi. Di Supabase, pindahkan logika yang sama ke database function agar klien bukan penentu final (lihat ARCHITECTURE.md).
- Waktu "resmi" di prototipe = jam perangkat. Zona waktu baru WIB.
- Kata sandi di-hash SHA-256 tanpa salt untuk prototipe lokal. Gantikan dengan Supabase Auth.
- Koordinat GPS peramban bisa dipalsukan oleh aplikasi lokasi palsu; selfie dan log audit adalah pelengkap, bukan jaminan.
