# Saya Hadir — Design System Baseline

Versi 1.0 · 23 Oktober 2026 · Status: baseline untuk direview, bukan implementasi final.

## Design principle

- **Product first:** setiap komponen harus membantu pengguna memahami status, membuat keputusan, atau menyelesaikan tugas.
- **Quiet professionalism:** padat secukupnya, bersih, natural, dan cocok untuk produk SaaS operasional perusahaan.
- **No decorative UI debt:** jangan menambah dekorasi yang tidak memperjelas hierarki atau status.
- **Responsive by intent:** mobile memiliki komposisi sesuai konteks, bukan hanya versi desktop yang diperkecil.

## Typography

- Font utama: `Plus Jakarta Sans`, dimuat secara eksplisit dengan bobot yang benar-benar digunakan.
- Bobot awal: 400 body, 500 label/controls, 600 heading/section, 700 hanya untuk penekanan besar.
- Body: 14–16 px; tabel/meta: 12–14 px; line-height cukup untuk scan cepat.
- Jangan menggunakan font default tanpa sengaja, mencampur banyak keluarga, atau memakai font display/futuristik.
- **Tidak menggunakan teks biru.** Heading, body, label, link, statistik, dan helper text memakai warna netral gelap/abu. Navy diperbolehkan sebagai latar sidebar/area brand; hijau menjadi aksen action/status seperlunya.

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `color-ink` | `#20262E` | Heading dan teks utama |
| `color-muted` | `#626C76` | Helper text dan metadata |
| `color-navy` | `#101B35` | Sidebar, logo area, struktur brand |
| `color-green` | `#247A4D` | CTA utama, success, selected control jika sesuai |
| `surface` | `#FFFFFF` | Permukaan utama |
| `surface-subtle` | `#F5F6F7` | Area sekunder dan panel ringan |
| `border` | `#E3E7EB` | Border, divider, garis tabel |
| `warning` | `#8A5B16` | Peringatan dengan teks/ikon |
| `danger` | `#A33A32` | Error/destructive dengan teks/ikon |

Nilai ini adalah token awal. Sebelum rilis, verifikasi kontras untuk pasangan warna yang benar-benar dipakai.

## Layout and components

- Grid dan spacing konsisten; gunakan kelipatan 4/8 px sebagai basis.
- Radius komponen konsisten: field/button lebih ringkas, panel/card sedang, hindari semua objek menjadi pill.
- Border halus lebih diutamakan daripada shadow besar.
- Maksimal satu aksi utama yang dominan pada satu area.
- Tabel digunakan saat perbandingan data penting; kartu hanya jika membantu scan di layar sempit.
- Ikon harus satu keluarga dan konsisten bobotnya. Jangan memasang ikon hanya untuk mengisi ruang.
- Status harus memiliki teks/label; warna tidak menjadi satu-satunya pembeda.
- Forms wajib punya label, helper/error text, disabled/loading state, dan konfirmasi untuk tindakan berisiko.

## Screen-specific hierarchy

### Landing page
1. Navbar logo + navigasi inti + Masuk + Daftar.
2. Hero dengan satu headline faktual, deskripsi singkat, CTA utama dan CTA sekunder.
3. Preview produk yang relevan dengan produk sebenarnya.
4. Manfaat inti (GPS, pengelolaan multi-perusahaan, laporan) tanpa statistik palsu.
5. Cara kerja, FAQ, CTA penutup, footer.

### Dashboard karyawan
1. Salam/tanggal dan jadwal kerja.
2. Status absensi hari ini.
3. Tombol utama sesuai state: check-in, check-out, atau selesai.
4. Informasi lokasi dan hasil validasi.
5. Riwayat pribadi.
6. Navigasi yang mudah dijangkau di ponsel.

### Dashboard Owner/HR
1. Pemilih perusahaan dan profil.
2. Ringkasan status yang relevan untuk tanggal/jadwal tersebut.
3. Filter periode.
4. Aktivitas terbaru / tabel utama.
5. Aksi cepat ke karyawan, jadwal, laporan.

## Anti-AI-slop guardrails

- No blue text.
- Tidak ada gradient/glow/glassmorphism dekoratif.
- Tidak ada orb, floating blobs, abstract sparkles, fake map, atau ilustrasi generik sebagai pengganti produk.
- Tidak ada statistik, testimonial, customer logo, grafik, activity log, atau harga yang direkayasa.
- Tidak menyusun setiap informasi menjadi kartu kecil yang identik.
- Tidak menggunakan headline bombastis atau copy generik yang tidak menyatakan manfaat nyata.
- Tidak menggunakan shadow berlapis atau animasi berlebihan.
- Tidak menghilangkan loading, empty, error, permission denied, invalid, success, dan disabled states.
- Jangan membuat interface terlihat aktif bila data belum terhubung; data demo diberi label jelas.
- Sebelum menambah elemen, tanyakan: **informasi atau keputusan apa yang dibantu elemen ini?** Jika tidak ada jawaban, hapus.

## Responsive rules

- Desktop admin: sidebar navy; content area putih/abu ringan; tabel dengan filter jelas.
- Mobile employee: tombol absensi tetap terlihat dan mudah dijangkau; navigasi bawah yang ringkas; kartu disusun vertikal.
- Form di mobile satu kolom; tidak ada teks/CTA yang terpotong.
- Hindari horizontal overflow; tabel yang tidak muat harus menjadi kartu atau memiliki scroll terkontrol dan label yang jelas.
- Respect `prefers-reduced-motion`; animasi hanya membantu transisi/status.

## Required states per page

- Initial/loading
- Success/confirmed
- Empty/no records
- Validation error
- Network/server error
- Permission denied/unauthorized
- Disabled/action unavailable
- Mobile narrow-screen state
