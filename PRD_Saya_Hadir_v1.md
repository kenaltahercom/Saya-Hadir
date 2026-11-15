# Product Requirements Document (PRD)
# Saya Hadir — Platform Absensi Digital Perusahaan

**Versi:** 1.0  
**Tanggal:** 23 Oktober 2026  
**Status:** Baseline produk untuk review desain sebelum coding  
**Platform:** Web responsif  
**Target:** Perusahaan dan karyawan  
**Arsitektur pilihan:** React + Vite + TypeScript, Supabase, GitHub, Vercel

---

## 1. Ringkasan eksekutif

Saya Hadir adalah aplikasi absensi digital berbasis web untuk membantu perusahaan mengelola kehadiran dengan validasi GPS. Produk terdiri dari website publik untuk menjelaskan layanan dan area aplikasi terautentikasi untuk Owner, HR, dan Karyawan.

Versi MVP berfokus pada registrasi perusahaan, pengaturan lokasi dan jam kerja, pengelolaan karyawan, check-in/check-out berbasis GPS, dashboard sesuai peran, riwayat, koreksi ber-audit, serta ekspor laporan CSV. Produk harus memisahkan data setiap perusahaan sejak schema dan kebijakan database dirancang.

Desain mengikuti arah SaaS profesional pada mockup ketiga yang dipilih: rapi, terstruktur, responsif, menggunakan Plus Jakarta Sans, navy sebagai struktur/area brand, permukaan putih/abu, aksen hijau untuk aksi/status, dan teks netral gelap. Hindari warna biru pada teks, efek visual generik, klaim palsu, dan elemen dekoratif tanpa tujuan.

## 2. Masalah dan nilai produk

Perusahaan membutuhkan cara yang lebih mudah untuk mengetahui kehadiran, mengurangi pencatatan manual, mengelola aturan kerja, dan merekap data dalam periode tertentu. Karyawan membutuhkan cara yang sederhana untuk absen dan memeriksa riwayat pribadinya.

**Proposisi nilai:** satu aplikasi web untuk melakukan dan mengelola absensi dengan aturan lokasi, jadwal, dan pelaporan yang jelas.

## 3. Tujuan produk dan metrik

### Tujuan MVP

1. Owner dapat membuat perusahaan dan menuntaskan pengaturan awal.
2. Owner/HR dapat menambahkan atau mengundang karyawan.
3. Karyawan dapat check-in/check-out dan menerima alasan yang jelas jika validasi gagal.
4. Owner/HR dapat memantau ringkasan dan mengekspor laporan sesuai izin.
5. Data lintas perusahaan tidak dapat dibaca atau dimodifikasi oleh akun yang tidak berhak.
6. Dua halaman prioritas—landing page dan dashboard karyawan—mempunyai pengalaman desktop/mobile yang matang.

### Indikator keberhasilan yang perlu diukur pada beta

- tingkat penyelesaian onboarding perusahaan;
- persentase undangan karyawan yang berhasil diterima;
- keberhasilan dan kegagalan check-in/check-out beserta penyebabnya;
- jumlah percobaan duplikasi yang dicegah;
- keberhasilan ekspor laporan;
- jumlah bug kritis akses lintas tenant;
- hasil usability test untuk menyelesaikan absensi dari ponsel.

Target angka belum ditetapkan. Angka target perlu disepakati setelah baseline dari pilot tersedia, bukan ditebak.

## 4. Target pengguna dan peran

### Owner
Pemilik/pengelola perusahaan. Mendaftarkan perusahaan, mengatur lokasi kantor dan jadwal, mengelola anggota serta peran, memantau laporan, dan mengendalikan izin HR.

### HR
Mengelola kegiatan operasional sesuai izin: karyawan, jadwal, rekap kehadiran, laporan, dan koreksi absensi bila diberikan izin.

### Karyawan
Melakukan absensi sendiri, melihat status hari ini dan riwayat pribadi, serta memperbarui informasi profil yang diizinkan.

### Matriks hak akses awal

| Kemampuan | Owner | HR | Karyawan |
|---|---|---|---|
| Melihat dashboard perusahaan | Ya | Ya | Tidak; dashboard pribadi |
| Check-in/check-out sendiri | Ya, jika terdaftar sebagai anggota aktif | Ya | Ya |
| Membaca riwayat pribadi | Ya | Ya | Ya |
| Melihat absensi seluruh perusahaan | Ya | Ya | Tidak |
| Mengelola karyawan | Ya | Ya, sesuai izin | Tidak |
| Mengatur lokasi/radius GPS | Ya | Tidak pada MVP | Tidak |
| Mengatur jadwal kerja | Ya | Jika diberi izin | Tidak |
| Mengoreksi absensi | Ya | Jika diberi izin | Tidak |
| Ekspor laporan perusahaan | Ya | Jika diberi izin | Tidak |
| Mengatur role/keanggotaan | Ya | Terbatas sesuai policy | Tidak |
| Mengalihkan kepemilikan | Ya | Tidak | Tidak |

Otorisasi harus diberlakukan di backend/database. Menyembunyikan menu pada frontend bukan kontrol keamanan.

## 5. Scope dan prioritas

### P0 — wajib untuk MVP
- Landing page publik dan CTA registrasi/login.
- Registrasi Owner, login, logout, reset kata sandi.
- Onboarding perusahaan dan lokasi kantor utama.
- Manajemen keanggotaan, undangan, dan status karyawan.
- Jadwal mingguan reguler, jam masuk/pulang, toleransi keterlambatan.
- GPS check-in/check-out dengan validasi server/database.
- Dashboard Owner/HR dan dashboard Karyawan.
- Riwayat absensi, filter laporan, ekspor CSV.
- Koreksi absensi dengan alasan dan audit log.
- RLS serta pengujian pemisahan data perusahaan.
- Desain responsif, state loading/empty/error, aksesibilitas dasar.

### P1 — setelah alur inti stabil
- Impor karyawan CSV dengan preview dan laporan kesalahan baris.
- Manajemen departemen yang lebih lengkap.
- Notifikasi in-app sederhana.
- Dashboard analitik periode yang lebih lengkap.
- XLSX export.

### Tidak termasuk MVP
Payroll; pengajuan cuti/izin kompleks; sistem shift malam kompleks; multi-branch; selfie/face recognition; QR code; mode offline; aplikasi native; billing/paket langganan; integrasi pihak ketiga yang belum ditentukan.

## 6. Informasi arsitektur dan sitemap

### Website publik
- `/` — landing page
- `/fitur` — penjelasan fitur
- `/cara-kerja` — langkah penggunaan
- `/tentang` — tentang Saya Hadir
- `/kontak` — kanal kontak
- `/privasi` — kebijakan privasi
- `/syarat` — syarat layanan
- `/login`, `/daftar`, `/lupa-password`

### Area aplikasi
- `/app/setup` — onboarding Owner
- `/app/dashboard` — dashboard sesuai role
- `/app/absensi` — proses check-in/check-out
- `/app/riwayat` — riwayat pribadi; akses laporan perusahaan hanya untuk admin berizin
- `/app/karyawan` — Owner/HR
- `/app/jadwal` — Owner dan HR yang diberi izin
- `/app/laporan` — Owner dan HR yang diberi izin
- `/app/pengaturan` — sesuai role
- `/app/profil` — semua akun

Pemilih perusahaan dapat muncul jika user memiliki beberapa keanggotaan. Pemilih ini hanya menentukan konteks UI; tiap request tetap harus memvalidasi membership dan akses melalui database.

## 7. Persyaratan fungsional

### FR-01 — Registrasi perusahaan
Owner mendaftar dengan nama, email, dan kata sandi, lalu membuat profil perusahaan. Akun tidak boleh otomatis memperoleh akses ke organisasi lain. Sistem harus menangani email yang perlu diverifikasi sesuai konfigurasi Auth.

**Acceptance criteria:** Owner dapat membuat perusahaan; membership Owner tercipta secara aman; kegagalan parsial tidak meninggalkan perusahaan tanpa Owner; pesan error tidak membocorkan informasi sensitif.

### FR-02 — Login dan pemulihan akun
Pengguna dapat login/logout, meminta pemulihan kata sandi, dan melihat pesan saat sesi kedaluwarsa.

**Acceptance criteria:** route terlindungi tidak terbuka untuk sesi anonim; setelah login, pengguna diarahkan berdasarkan status onboarding dan membership; setelah logout, data privat tidak tetap dapat diakses melalui navigasi aplikasi.

### FR-03 — Onboarding
Empat langkah: profil perusahaan, lokasi kantor, jadwal kerja, review dan konfirmasi.

**Acceptance criteria:** setiap langkah divalidasi; kemajuan yang sudah disimpan dapat dilanjutkan; koordinat/radius/jadwal tidak ditandai siap sebelum valid; lokasi manual dapat dimasukkan bila izin browser ditolak.

### FR-04 — Anggota dan undangan
Owner/HR dapat menambah dan menonaktifkan karyawan sesuai izin. Undangan ber-token aman mempunyai status dan masa berlaku.

**Acceptance criteria:** kode karyawan unik di dalam perusahaan; user yang belum menerima undangan tidak mendapat membership aktif; pengguna nonaktif kehilangan akses ke perusahaan; mengirim ulang undangan tidak membuat membership ganda.

### FR-05 — Jadwal kerja
Owner membuat jadwal mingguan dengan hari aktif, jam masuk, jam pulang, dan toleransi terlambat.

**Acceptance criteria:** jadwal dapat ditautkan ke anggota; hari nonkerja tidak dihitung terlambat; perubahan jadwal tidak diam-diam mengubah interpretasi riwayat yang lama; sif lintas tengah malam ditandai di luar scope MVP.

### FR-06 — Check-in/check-out GPS
Karyawan menekan tombol absensi, memberi izin lokasi, lalu server/database memverifikasi membership, status harian, jadwal, koordinat, jarak, dan akurasi.

**Acceptance criteria:** timestamp resmi berasal dari server/database; absensi hanya dianggap sukses setelah transaksi tersimpan; request ulang tidak membuat catatan ganda; lokasi di luar radius/akurasi yang ditentukan ditolak dengan alasan jelas; lokasi tidak dilacak di latar belakang.

Nilai uji awal yang diusulkan: radius 150 meter, batas akurasi 100 meter. Nilai ini configurable dan perlu diuji di lokasi nyata. GPS browser tidak menjamin anti-spoofing penuh.

### FR-07 — Dashboard Owner/HR
Menampilkan total karyawan aktif dan status relevan hari tersebut, daftar aktivitas terbaru, filter tanggal, serta akses cepat ke pengelolaan karyawan, jadwal, dan laporan.

**Acceptance criteria:** semua angka berasal dari query terotorisasi; status “tidak hadir” tidak ditampilkan sebelum aturan jadwal membuat status itu valid; HR hanya melihat fitur sesuai izin.

### FR-08 — Dashboard Karyawan
Menampilkan status hari ini, jadwal kerja, CTA check-in/check-out sesuai state, dan riwayat pribadi.

**Acceptance criteria:** CTA berubah berdasarkan status yang tersimpan; karyawan tidak dapat membaca riwayat orang lain; status lokasi/absensi ditampilkan dengan teks dan bukan warna saja; mobile memprioritaskan tombol utama.

### FR-09 — Koreksi dan audit
Pengguna berizin dapat melakukan koreksi dengan alasan. Simpan nilai sebelum/sesudah, aktor, dan waktu.

**Acceptance criteria:** karyawan tidak dapat mengoreksi sendiri; audit record tidak dapat dimanipulasi melalui UI biasa; laporan menunjukkan nilai absensi yang berlaku.

### FR-10 — Riwayat dan laporan
Filter berdasarkan tanggal, anggota, dan status sesuai role; ekspor CSV dengan kolom yang jelas.

**Acceptance criteria:** ekspor mengikuti filter dan izin; data hasil unduhan konsisten dengan hasil yang ditampilkan; koordinat GPS mentah tidak diekspos dalam laporan rutin tanpa kebutuhan yang disetujui.

### FR-11 — Impor karyawan CSV (P1)
Upload file, petakan kolom, preview, validasi duplikasi, lalu konfirmasi.

**Acceptance criteria:** tidak ada perubahan data sebelum konfirmasi; baris error punya alasan; hasil impor melaporkan jumlah berhasil/gagal; file mentah tidak disimpan lebih lama daripada kebutuhan.

## 8. Spesifikasi UX layar utama

### 8.1 Landing page
**Tujuan:** membantu calon pelanggan memahami fungsi Saya Hadir dan mulai membuat akun.

Urutan: navbar; hero berisi headline spesifik dan CTA; preview produk yang relevan; manfaat utama; cara kerja; FAQ; CTA penutup; footer.

CTA utama menuju registrasi Owner; CTA sekunder menuju login/fitur. Jangan menampilkan testimoni, logo pelanggan, angka pelanggan, uptime, atau harga yang belum disahkan. Hindari copy bombastis. Headline harus menjelaskan manfaat absensi secara spesifik.

### 8.2 Login dan registrasi
Formulir satu kolom pada mobile; pada desktop boleh menggunakan layout split yang tetap tenang. Sediakan state invalid, submitting, success, error, password visibility, reset password, dan verifikasi email sesuai konfigurasi. Copy error harus spesifik secukupnya tanpa membocorkan data akun.

### 8.3 Onboarding
Stepper empat langkah: profil → lokasi → jadwal → review. Sediakan back/continue, penyimpanan progres yang aman, validasi inline, dan pesan bila lokasi tidak bisa diambil.

### 8.4 Dashboard Karyawan
Prioritas urutan: sapaan/tanggal dan jadwal; kartu status hari ini; CTA check-in/check-out; status izin/validasi GPS; riwayat terbaru; profil. Mobile menggunakan navigasi ringkas di bawah atau pola menu yang mudah dijangkau.

### 8.5 Halaman GPS
State wajib: belum meminta lokasi, meminta lokasi, memperoleh lokasi, validasi server, berhasil, di luar radius, akurasi buruk, izin ditolak, jaringan gagal, sesi habis, sudah tercatat. Jangan menampilkan sukses optimistis sebelum server menyimpan data.

### 8.6 Dashboard Owner/HR
Sidebar desktop navy; mobile memakai menu lipat. KPI secukupnya, filter tanggal, ringkasan status, aktivitas terbaru, dan aksi cepat. Jangan tampilkan angka demo sebagai data nyata.

### 8.7 Manajemen karyawan
Search, filter status, daftar karyawan, tambah anggota, undangan tertunda, edit, nonaktifkan, dan (P1) impor CSV. Tabel desktop berubah menjadi kartu atau layout yang dapat dipindai di mobile.

### 8.8 Jadwal kerja
Daftar jadwal, buat/edit, hari aktif, jam, toleransi keterlambatan, anggota terkait, dan peringatan sebelum mengubah jadwal historis.

### 8.9 Laporan
Filter periode, karyawan, status; ringkasan; tabel hasil; pagination; ekspor CSV. Empty state menjelaskan cara memulai. Status belum check-out tidak dianggap pulang otomatis.

## 9. Sistem desain dan anti-AI-slop

### Token awal

| Token | Nilai | Penggunaan |
|---|---|---|
| `ink` | `#20262E` | Heading/body utama |
| `text-muted` | `#626C76` | Deskripsi dan metadata |
| `navy` | `#101B35` | Sidebar/area brand, bukan warna teks isi pada latar putih |
| `green` | `#247A4D` | CTA utama dan status berhasil |
| `surface` | `#FFFFFF` | Latar kartu/halaman utama |
| `surface-subtle` | `#F5F6F7` | Latar pendukung |
| `border` | `#E3E7EB` | Pemisah dan batas komponen |
| `warning` | `#8A5B16` | Status peringatan dengan label/ikon |
| `danger` | `#A33A32` | Error/destructive dengan label/ikon |

### Tipografi
Plus Jakarta Sans dimuat secara eksplisit. Gunakan bobot 400/500/600/700 secara bermakna. Body 14–16 px; label tabel umumnya 12–14 px; heading konsisten dan tidak terlalu besar. Hindari campuran beberapa font tanpa alasan. Jangan gunakan font “AI-looking” default yang tidak disengaja.

### Aturan agar UI tidak terlihat generik/AI-generated

- Tidak ada teks biru.
- Jangan memakai gradient/glow/glassmorphism sebagai dekorasi utama.
- Hindari dashboard yang seluruhnya tersusun dari kartu kecil identik; gunakan tabel dan struktur yang sesuai dengan tugas.
- Jangan membuat semua sudut terlalu bulat. Radius digunakan konsisten menurut jenis komponen.
- Gunakan satu keluarga ikon konsisten; ikon harus membantu mengenali tindakan atau status.
- Setiap komponen harus punya fungsi atau informasi yang jelas.
- Gunakan bahasa Indonesia natural, spesifik, dan tenang; hindari tagline generik/bombastis.
- Jangan menampilkan angka, chart, testimoni, logo, atau log aktivitas fiktif seolah-olah produksi.
- Buat state loading, empty, error, permission denied, and success sebagai bagian desain utama.
- Gunakan whitespace dengan konsisten; fokus utama setiap layar harus jelas.
- Responsif berarti menyusun ulang prioritas, bukan sekadar mengecilkan desktop.
- Animasi singkat dan membantu status; hormati `prefers-reduced-motion`.
- Jangan menambahkan ornamen abstrak atau shadow yang bersaing dengan informasi.

## 10. Arsitektur dan data

### Teknologi
- Frontend: React + Vite + TypeScript.
- UI: Tailwind CSS dan komponen aksesibel (misalnya shadcn/ui/Radix bila cocok dengan repository); ikon satu keluarga (misalnya Lucide); animasi ringan bila dibutuhkan.
- Backend/data: Supabase Auth, PostgreSQL, RLS, Storage privat, dan Edge Functions/Database Functions untuk operasi sensitif.
- Repo dan deploy: GitHub + Vercel.

### Entitas inti

| Entitas | Isi utama |
|---|---|
| `profiles` | Profil user yang terkait dengan auth user |
| `companies` | Identitas perusahaan, zona waktu, koordinat kantor, radius/akurasi |
| `company_memberships` | User, company, role, kode karyawan, status, jadwal terkait |
| `departments` | Departemen bila masuk ke UI MVP |
| `work_schedules` | Nama jadwal dan aturan umum |
| `work_schedule_days` | Hari kerja, jam masuk/pulang, aktif/tidak |
| `attendance_records` | Satu catatan per membership/tanggal kerja; timestamp dan hasil check-in/out |
| `attendance_events` | Percobaan absensi dan hasil validasi termasuk yang ditolak sesuai kebijakan |
| `company_invitations` | Email, role, token hash, status, kedaluwarsa, pengundang |
| `audit_logs` | Aktor, aksi, entitas, perubahan, waktu |
| `import_jobs` | Status impor, jumlah berhasil/gagal, pemilik dan file bila perlu |

### Constraints penting

- Keanggotaan unik per pasangan company/user.
- Satu catatan absensi per membership dan tanggal kerja pada MVP.
- Kode karyawan unik per perusahaan.
- Foreign key dan validasi company-consistency untuk mencegah hubungan lintas tenant yang salah.
- Timestamp disimpan konsisten dan ditampilkan menurut zona waktu perusahaan.
- Indeks pada kolom filter/relasi yang digunakan oleh policy dan laporan.
- Semua tabel yang terekspos memakai grants dan RLS yang eksplisit serta mempunyai tes allow/deny.

## 11. Keamanan, privasi, dan integritas

- Minta izin lokasi pada saat aksi check-in/check-out, bukan terus-menerus.
- Jelaskan tujuan pengumpulan lokasi dan simpan hanya data yang dibutuhkan untuk bukti absensi/operasional sesuai kebijakan retensi yang nanti ditetapkan.
- Validasi geofence pada sisi tepercaya; jangan mempercayai jarak yang dihitung frontend.
- Gunakan waktu server/database.
- Lindungi operasi perusahaan, role, koreksi, dan undangan di backend.
- Jangan mengekspos secret/service-role key di frontend.
- Terapkan RLS pada tabel publik/terekspos dan storage policies jika menyimpan file privat.
- Siapkan pengujian untuk mencoba membaca/menulis data milik tenant lain serta eskalasi role.
- Tinjau kewajiban privasi dan perlindungan data yang berlaku sebelum rilis produksi.

## 12. Persyaratan nonfungsional

### Responsivitas
Dukungan layout mobile, tablet, desktop; tombol absensi mudah dijangkau; tabel dapat disusun ulang atau digeser terkontrol.

### Aksesibilitas
Navigasi keyboard, fokus terlihat, label form, pesan error yang terhubung ke input, contrast memadai, status bukan hanya warna, reduced-motion support.

### Keandalan
Operasi absensi idempotent; error jaringan memberi recovery yang jelas; data tidak dianggap tersimpan sebelum konfirmasi server; audit penting tetap bisa ditelusuri.

### Kinerja
Hindari query berulang yang tidak perlu; paginasi laporan; gunakan indeks untuk query RLS; tampilkan loading state. Target angka kinerja final ditetapkan setelah pengujian baseline.

### Maintainability
TypeScript, komponen reusable, feature boundary jelas, migrations ter-versioning, test, lint, environment variables terdokumentasi, README setup dan deployment.

## 13. Pengujian dan acceptance checklist release

1. Registrasi membuat Owner, company, dan membership secara konsisten.
2. Akun tanpa sesi tidak dapat mengakses route privat atau data privat.
3. Perusahaan A tidak bisa membaca/mengubah data Perusahaan B melalui UI maupun API.
4. Karyawan tidak dapat membaca riwayat karyawan lain atau mengubah role.
5. HR tidak bisa mengubah lokasi kantor kecuali kebijakan produk nanti mengizinkan.
6. GPS valid dalam radius dapat diproses; luar radius/akurasi buruk/izin ditolak ditangani dengan benar.
7. Waktu absensi berasal dari server/database; duplicate submit tidak membuat record ganda.
8. Hari nonkerja dan status karyawan mengikuti aturan jadwal.
9. Koreksi admin memerlukan izin dan alasan serta menghasilkan audit record.
10. Filter dan hasil CSV mengikuti filter serta permission.
11. Desktop/mobile diperiksa; tombol utama, form, tabel, state error/empty/loading jelas.
12. Build production dan test yang tersedia lulus.
13. Tidak ada secret di bundle/repository.
14. Refresh route Vercel dan environment variables sudah diuji.
15. Semua angka/demo state yang belum berasal dari database ditandai jelas atau dihapus sebelum rilis.

## 14. Rencana rilis bertahap

**Tahap A — Design baseline:** kunci landing page dan dashboard karyawan, desktop/mobile, tokens, copy, states.  
**Tahap B — Scaffold:** React/Vite/TS, lint/test, routing, design tokens, layout responsif, env template.  
**Tahap C — Auth dan tenant foundation:** Supabase Auth, profiles, companies, memberships, RLS, tests.  
**Tahap D — Operational core:** onboarding, karyawan, jadwal, GPS check-in/out.  
**Tahap E — Reporting:** dashboard Owner/HR, riwayat, koreksi, audit, CSV.  
**Tahap F — Release hardening:** test security, responsive QA, build, deployment, documentation.

Jangan mulai tahap implementasi fitur penuh sebelum desain landing page/dashboard karyawan dan sistem token disepakati.

## 15. Risiko dan open decisions

| Isu | Status | Tindakan |
|---|---|---|
| Radius/akurasi GPS | Nilai awal sementara | Uji lapangan; jadikan konfigurasi Owner |
| Penanganan GPS spoofing | Bukan jaminan MVP | Dokumentasikan batasannya; nilai mitigasi lebih lanjut berdasarkan risiko |
| Jam kerja lintas tengah malam | Di luar MVP | Definisikan date attribution sebelum dibangun |
| Banyak kantor per perusahaan | Di luar MVP | Masukkan backlog bila kebutuhan pilot jelas |
| Retensi lokasi/event | Belum diputuskan | Tetapkan dengan pertimbangan operasional dan privasi sebelum production |
| Notifikasi undangan | Cara pengiriman perlu dipilih | Tentukan email provider dan konfigurasi sebelum aktivasi |
| Pricing / billing | Belum ditetapkan | Jangan tampilkan harga atau paket fiktif di landing page |
| Indikator KPI dan target | Belum ada baseline | Ukur pada pilot sebelum menentukan target numerik |

## 16. Context engineering untuk kelanjutan project

### Prinsip
Context engineering adalah kurasi seluruh konteks yang diberikan ke AI: instruksi, PRD, design system, keputusan, kode aktual, schema, tes, dan hasil percakapan. Tujuannya agar model mendapat informasi yang relevan dan tidak bertentangan, bukan sekadar prompt yang panjang.

### File sumber-kebenaran yang perlu dipelihara
- `PRD.md`: requirements dan acceptance criteria.
- `PROJECT_CONTEXT.md`: keputusan stabil dan guardrails.
- `DESIGN_SYSTEM.md`: token, tipografi, komponen, anti-pattern.
- `ARCHITECTURE.md`: struktur frontend/backend dan batas kepercayaan.
- `DECISIONS.md`: keputusan, alasan, tanggal, dampak.
- `TASKS.md`: status/backlog/next action.
- `QA_CHECKLIST.md`: regresi, aksesibilitas, RLS, dan release gates.
- `PROMPT_KIT.md`: master prompt serta task prompt.

Jangan menyertakan semua konteks untuk setiap tugas. Ambil subset yang relevan, utamakan sumber-kebenaran terbaru, pisahkan fakta/asumsi, minta implementasi bertahap, dan wajibkan testing. Ringkas hasil sesi dan perbarui keputusan setelah kerja selesai.

## 17. Referensi

1. Anthropic, [“Effective context engineering for AI agents”](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents), 29 September 2025.
2. OpenAI, [“Prompt engineering”](https://developers.openai.com/api/docs/guides/prompt-engineering).
3. OpenAI, [“Prompting”](https://learn.chatgpt.com/docs/prompting).
4. Supabase, [“Row Level Security”](https://supabase.com/docs/guides/database/postgres/row-level-security).
5. Supabase, [“Storage Access Control”](https://supabase.com/docs/guides/storage/security/access-control).
