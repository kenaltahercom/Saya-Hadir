import { Link } from 'react-router-dom'
import { Brand, StatusBadge } from '../../components/ui'

const FAQ = [
  ['Apakah lokasi karyawan dilacak sepanjang hari?', 'Tidak. Lokasi hanya diminta saat karyawan menekan tombol absen masuk atau pulang, lalu dibandingkan dengan titik kantor. Tidak ada pelacakan di latar belakang.'],
  ['Bisakah karyawan curang dengan jam ponsel?', 'Waktu absensi resmi diambil dari sisi sistem, bukan dari jam ponsel karyawan. Perlu dicatat: koordinat GPS dari peramban tidak 100% kebal terhadap aplikasi lokasi palsu, jadi gunakan selfie dan log audit sebagai pelengkap.'],
  ['Bagaimana jika GPS karyawan tidak akurat atau ia lupa absen?', 'Owner atau HR bisa mengoreksi atau mencatat absensi manual. Alasan wajib diisi dan setiap perubahan tercatat di log audit lengkap dengan nilai sebelum dan sesudahnya.'],
  ['Apakah ini aplikasi yang harus dipasang?', 'Tidak. Saya Hadir berjalan di peramban ponsel maupun desktop. Karyawan memakai tampilan ponsel; Owner dan HR memakai tampilan desktop untuk mengelola data.'],
  ['Bisa impor data karyawan yang sudah ada?', 'Bisa, lewat berkas CSV. Sistem menampilkan pratinjau dan memvalidasi tiap baris sebelum ada data yang disimpan.'],
]

export default function Landing() {
  return (
    <>
      <div className="l-wrap">
        <header className="l-nav">
          <Brand />
          <nav aria-label="Navigasi halaman">
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#faq">Pertanyaan umum</a>
          </nav>
          <div className="row">
            <Link to="/login" className="btn btn-quiet btn-sm">
              Masuk
            </Link>
            <Link to="/daftar" className="btn btn-dark btn-sm">
              Daftar
            </Link>
          </div>
        </header>

        <section className="l-hero">
          <div>
            <h1>Absensi yang hanya sah bila karyawan benar-benar di kantor.</h1>
            <p className="lead">Karyawan absen dari ponsel. Sistem memeriksa jarak ke kantor, akurasi GPS, dan jadwal kerja sebelum mencatat. Owner dan HR mengelola semuanya dari desktop.</p>
            <div className="l-cta">
              <Link to="/daftar" className="btn btn-primary">
                Daftarkan perusahaan
              </Link>
              <Link to="/login" className="btn">
                Coba dengan akun demo
              </Link>
            </div>
            <p className="l-note">Tanpa kartu kredit. Tampilan di kanan hanyalah contoh data.</p>
          </div>

          <div className="preview" aria-label="Contoh tampilan produk">
            <span className="tag-demo preview-label">CONTOH TAMPILAN</span>
            <div className="mini-table" aria-hidden="true">
              <div className="head">
                <span>Karyawan</span>
                <span>Masuk</span>
                <span>Status</span>
              </div>
              <div>
                <span>Contoh A</span>
                <span className="num">07:52</span>
                <StatusBadge status="ontime" />
              </div>
              <div>
                <span>Contoh B</span>
                <span className="num">08:21</span>
                <StatusBadge status="late" />
              </div>
              <div>
                <span>Contoh C</span>
                <span className="num">–</span>
                <StatusBadge status="leave" />
              </div>
            </div>
            <div className="phone" aria-hidden="true">
              <div className="phone-in">
                <div>
                  <strong style={{ fontSize: 15 }}>Selamat pagi</strong>
                  <p className="muted small">Shift 08:00 – 17:00</p>
                </div>
                <div className="status-card">
                  <div className="status-line">
                    <span>Absen masuk</span>
                    <strong className="num">07:52</strong>
                  </div>
                  <p className="hint">42 m dari kantor · akurasi 12 m</p>
                  <div className="phone-btn">Absen pulang</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="l-section alt" id="fitur">
        <div className="l-wrap">
          <h2>Dibuat untuk pekerjaan HR sehari-hari</h2>
          <p className="sub">Bukan sekadar tombol “hadir”. Setiap catatan bisa dipertanggungjawabkan.</p>
          <div className="l-cols three">
            <div>
              <h3>Validasi lokasi saat absen</h3>
              <p>Jarak ke titik kantor dan akurasi GPS diperiksa untuk setiap absen. Radius dan batas akurasi bisa Anda ubah sesuai kondisi gedung.</p>
            </div>
            <div>
              <h3>Jadwal, toleransi, dan status</h3>
              <p>Atur hari kerja, jam masuk, dan toleransi keterlambatan per jadwal. Status tepat waktu atau terlambat dihitung otomatis.</p>
            </div>
            <div>
              <h3>Rekap, koreksi, dan audit</h3>
              <p>Filter rekap per periode, departemen, atau status lalu ekspor CSV. Koreksi manual wajib beralasan dan tercatat siapa, kapan, dan apa yang berubah.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="l-section" id="cara-kerja">
        <div className="l-wrap l-split">
          <div>
            <h2>Siap dipakai dalam tiga langkah</h2>
            <p className="sub">Urutan ini sama dengan checklist awal yang muncul di dashboard Owner.</p>
          </div>
          <div className="l-cols" style={{ marginTop: 0 }}>
            <div>
              <span className="n">1</span>
              <h3>Atur lokasi dan jadwal</h3>
              <p>Tentukan titik kantor, radius, serta jam kerja. Titik kantor bisa diambil langsung dari lokasi perangkat Anda.</p>
            </div>
            <div>
              <span className="n">2</span>
              <h3>Tambahkan karyawan</h3>
              <p>Input satu per satu atau impor CSV. Setiap karyawan mendapat akun untuk masuk dari ponselnya.</p>
            </div>
            <div>
              <span className="n">3</span>
              <h3>Karyawan absen, Anda memantau</h3>
              <p>Ringkasan hari ini dan rekap bulanan terisi dari absensi nyata, tanpa input ulang.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="l-section alt" id="faq">
        <div className="l-wrap l-split">
          <h2>Pertanyaan yang biasanya muncul</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="l-close">
        <div className="l-wrap">
          <h2>Mulai dari lokasi kantor Anda.</h2>
          <p>Pendaftaran Owner memakan waktu sekitar dua menit.</p>
          <div className="l-cta">
            <Link to="/daftar" className="btn btn-primary">
              Daftarkan perusahaan
            </Link>
          </div>
        </div>
      </section>

      <div className="l-wrap">
        <footer className="l-foot">
          <span>© 2026 Saya Hadir</span>
          <span>Lokasi hanya diminta saat absen. Tidak ada pelacakan latar belakang.</span>
        </footer>
      </div>
    </>
  )
}
