# Saya Hadir — Project Context (Source of Truth)

> Versi: 1.0 · Status: baseline perencanaan · Tanggal: 23 Oktober 2026
> Gunakan dokumen ini bersama `PRD_Saya_Hadir_v1.md` dan `PROMPT_KIT.md`. Jika informasi bertentangan, ikuti aturan prioritas pada bagian **Resolusi konflik**.

## 1. Identitas produk

**Nama:** Saya Hadir  
**Deskripsi:** platform absensi digital berbasis web untuk perusahaan, dengan validasi lokasi GPS, pengelolaan karyawan, jadwal kerja, riwayat, dan laporan.  
**Audiens utama:** perusahaan dan karyawan.  
**Model akun:** multi-tenant / multi-perusahaan. Setiap perusahaan memiliki ruang data sendiri.  
**Peran awal:** Owner, HR, Karyawan.  
**Stack pilihan:** React + Vite + TypeScript; Supabase Auth + PostgreSQL + Row Level Security (RLS); Supabase Storage untuk berkas yang benar-benar perlu disimpan; GitHub untuk source control; Vercel untuk deployment.  
**Urutan kerja:** matangkan landing page dan dashboard karyawan terlebih dahulu; lanjutkan pola desain pada dashboard Owner/HR; baru implementasi bertahap.

## 2. Keputusan desain yang tidak boleh hilang

- Referensi visual utama adalah mockup UI/UX ketiga yang dipilih pengguna: SaaS profesional, bersih, terstruktur, desktop dan mobile.
- Font produk: **Plus Jakarta Sans**, dimuat secara eksplisit; jangan bergantung pada font default browser.
- Teks utama memakai warna netral gelap, misalnya `#20262E`; teks sekunder memakai abu-abu netral, misalnya `#626C76`.
- **Hindari teks biru**. Biru sebagai warna font terasa generik/“AI banget” bagi pengguna. Jangan menggunakan warna biru untuk heading, body copy, link, statistik, atau label. Navy boleh menjadi latar/sidebar dan struktur visual, bukan warna teks utama pada halaman putih.
- Palet awal: navy `#101B35` untuk sidebar/area brand; putih `#FFFFFF`; abu-abu permukaan `#F5F6F7`; border `#E3E7EB`; hijau `#247A4D` atau `#1F7A4D` untuk tindakan utama/status berhasil. Status warning dan error harus menggunakan teks, ikon, atau label selain warna.
- Gunakan satu keluarga font dengan bobot terkontrol (400, 500, 600, 700), spasi yang konsisten, dan hierarki ukuran yang jelas.
- Tampilan harus terasa dibuat untuk kerja HR sungguhan, bukan template generik: tabel realistis, label spesifik, state loading/empty/error, prioritas tindakan yang jelas, dan jumlah kartu secukupnya.
- Animasi ringan dan fungsional saja. Hindari gradasi dekoratif, glow, glassmorphism, ornamen abstrak yang tidak punya fungsi, angka statistik palsu, testimoni palsu, teks placeholder, serta ikon dekoratif berlebihan.
- Mockup adalah referensi arah visual; hasil akhir harus berupa komponen web yang responsif dan benar-benar bekerja, bukan gambar statis.

## 3. Produk dan scope

### MVP

1. Landing page yang menjelaskan nilai produk dan mengarahkan perusahaan ke registrasi.
2. Registrasi Owner, login, logout, dan reset kata sandi.
3. Onboarding perusahaan: profil, lokasi kantor, radius/akurasi GPS, jadwal kerja dasar.
4. Manajemen anggota/karyawan dan undangan.
5. Check-in/check-out berbasis GPS yang divalidasi server/database.
6. Dashboard Owner/HR dan dashboard Karyawan.
7. Riwayat absensi pribadi; rekap absensi perusahaan untuk Owner/HR.
8. Jadwal kerja reguler mingguan dan aturan keterlambatan.
9. Koreksi absensi yang diotorisasi dengan alasan dan audit log.
10. Impor karyawan via CSV dan ekspor laporan CSV.
11. Layout responsif, keamanan multi-tenant, dan pengujian akses.

### Bukan target MVP

Payroll, cuti/izin kompleks, sif lintas tengah malam, banyak cabang kantor, face recognition, selfie, QR code, offline mode, aplikasi mobile native, billing langganan, integrasi WhatsApp/HRIS/payroll pihak ketiga.

## 4. Aturan bisnis yang disepakati

- Perusahaan menjadi batas isolasi data. Setiap keanggotaan dan catatan operasional terkait `company_id`.
- User bisa memiliki lebih dari satu keanggotaan perusahaan di masa depan; pemilih perusahaan hanya mengatur konteks UI dan tidak menggantikan otorisasi backend.
- Satu catatan absensi per keanggotaan per tanggal kerja pada MVP. Check-in/check-out harus idempotent/terlindung dari request ganda.
- Lokasi diminta hanya saat pengguna memulai absensi; tidak ada pelacakan latar belakang.
- Waktu resmi berasal dari server/database, bukan jam perangkat klien.
- Server/database memeriksa keanggotaan, aturan jadwal, jarak koordinat dan akurasi GPS sebelum menerima absensi. Frontend bukan sumber keputusan final.
- Radius 150 m dan batas akurasi 100 m adalah nilai awal untuk uji coba, bukan standar universal; konfigurasi dapat diubah Owner.
- Status terlambat dihitung dari jadwal dan waktu absensi resmi. Jangan menandai karyawan absen sebelum aturan hari kerja dan waktu yang berlaku membuat status itu valid.
- Koreksi manual menyimpan aktor, waktu, alasan, dan nilai perubahan dalam audit log.
- Tidak menampilkan koordinat GPS mentah pada laporan umum kecuali ada kebutuhan operasional yang sah dan izin khusus.

## 5. Keamanan minimum

- Aktifkan RLS di semua tabel yang terekspos melalui API; tentukan grants dan policies secara spesifik.
- Owner/HR hanya dapat mengakses perusahaan yang diikuti dan sesuai izinnya.
- Karyawan hanya dapat membaca riwayat pribadinya dan tidak bisa mengubah peran sendiri.
- Jangan pernah menaruh `service_role` key atau rahasia server di frontend, repository publik, atau variabel `VITE_*`.
- Uji kasus allow dan deny untuk setiap tabel dan operasi relevan (SELECT/INSERT/UPDATE/DELETE).
- Proteksi Storage dengan policies; gunakan bucket privat untuk dokumen privat.
- Perubahan role, keanggotaan, pengaturan GPS, dan koreksi kehadiran harus tervalidasi di sisi tepercaya.

## 6. Prinsip implementasi

- TypeScript strict bila memungkinkan; komponen reusable dan feature folders yang jelas.
- Pisahkan UI, logika domain, dan akses Supabase. Jangan menyebarkan query database langsung ke banyak komponen.
- Migrasi database harus tersimpan dalam repository dan dapat diulang di environment baru.
- Semua halaman punya loading, empty, success, dan error state.
- Semua aksi utama harus benar-benar bekerja; jangan biarkan tombol dekoratif atau data dummy yang tampak seperti data nyata.
- Seed/demo data hanya boleh tampil di lingkungan development yang jelas diberi label.
- Sebelum deployment: build production lulus, test utama lulus, RLS tests lulus, `.env` aman, dan alur refresh route berfungsi.

## 7. Resolusi konflik

Urutan prioritas bila informasi bertentangan:

1. Instruksi terbaru dan eksplisit dari pemilik produk.
2. Dokumen PRD dan keputusan yang secara eksplisit ditandai **LOCKED**.
3. `PROJECT_CONTEXT.md`.
4. Catatan diskusi lama atau asumsi AI.

Jika suatu keputusan penting belum ada atau berkonflik, jangan mengarang. Catat sebagai `OPEN QUESTION`, jelaskan dampak pilihan, lalu minta keputusan hanya jika blocking. Jika non-blocking, gunakan asumsi paling aman dan tulis asumsi itu dengan jelas.

## 8. Definition of done untuk tugas AI

Sebuah tugas belum selesai hanya karena kode dihasilkan. Tugas selesai jika:

- semua acceptance criteria dalam brief terpenuhi;
- perubahan tidak melanggar keputusan desain, keamanan, atau arsitektur;
- aplikasi/build/test yang relevan dijalankan dan hasilnya dilaporkan dengan jujur;
- error dan edge states ditangani;
- tidak ada tombol palsu, angka fiktif, atau komponen tak terpakai;
- ringkasan perubahan, file yang disentuh, pengujian yang dijalankan, hasil, risiko, dan next step dicatat;
- keputusan baru diperbarui dalam `DECISIONS.md` (jika proyek sudah memilikinya).
