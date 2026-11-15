# Perubahan redesain (v3)

## Arah
- Karyawan = mobile-first (bottom nav, tombol aksi besar di jangkauan jempol). Owner/HR = desktop (sidebar, tabel data, filter, impor/ekspor).
- Semua token mengikuti DESIGN_SYSTEM.md: Plus Jakarta Sans saja (400–700), tanpa teks biru, tanpa gradient/glow/shadow dekoratif.

## Dihapus karena "AI slop" atau menyesatkan
- Foto stok Unsplash untuk orang fiktif → avatar inisial + unggah foto sendiri.
- Gradient sidebar, glow tombol, pill di mana-mana, badge "Real-Time"/"Sparkles".
- Role switcher "Mode Karyawan/Mode Admin" di sidebar → login nyata dengan peran.
- Fallback yang diam-diam menganggap absen BERHASIL saat GPS gagal → sekarang gagal dengan penjelasan dan jalan keluar.
- Mode "kamera saja" (tanpa validasi lokasi) dan label "Selfie Biometrik" → selfie jadi aturan perusahaan (opsional/wajib) di atas GPS, bukan pengganti.
- Font Outfit & JetBrains Mono, favicon bawaan Vite, file `varcel.json` (typo), kolom cari di header yang tidak berfungsi, dropdown perusahaan palsu.
- Statistik/grafik karangan di dashboard → hanya dihitung dari data absensi nyata.

## Ditambahkan
- Lapisan data (`lib/store.ts`) sehingga admin dan karyawan benar-benar berbagi data; audit log otomatis.
- Karyawan: tabel database (cari, filter, urut, paginasi), tambah/ubah/nonaktifkan, impor CSV dengan pratinjau & validasi per baris, ekspor, template.
- Jadwal: CRUD dengan validasi, aturan toleransi dijelaskan.
- Rekap: filter periode/departemen/status, ekspor mengikuti filter, koreksi + catat manual dengan alasan wajib.
- Lokasi: "Pakai lokasi perangkat ini", radius & akurasi bisa diatur, opsi wajib selfie.
- Checklist onboarding, daftar "perlu perhatian", tren 7/14/30 hari di Ringkasan.
- Alamat lama (`/app/dashboard`, `/app/absensi`, dst.) otomatis diarahkan ke alamat baru.
