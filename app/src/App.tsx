import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell, Guard, MobileShell } from './components/shells'
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import Beranda from './pages/app/Beranda'
import Absen from './pages/app/Absen'
import Riwayat from './pages/app/Riwayat'
import Profil from './pages/app/Profil'
import Ringkasan from './pages/admin/Ringkasan'
import Karyawan from './pages/admin/Karyawan'
import Jadwal from './pages/admin/Jadwal'
import Rekap from './pages/admin/Rekap'
import Lokasi from './pages/admin/Lokasi'
import Audit from './pages/admin/Audit'

const emp = (el: React.ReactNode) => (
  <Guard area="employee">
    <MobileShell>{el}</MobileShell>
  </Guard>
)
const adm = (el: React.ReactNode) => (
  <Guard area="admin">
    <AdminShell>{el}</AdminShell>
  </Guard>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/daftar" element={<Register />} />

      <Route path="/app" element={emp(<Beranda />)} />
      <Route path="/app/absen" element={emp(<Absen />)} />
      <Route path="/app/riwayat" element={emp(<Riwayat />)} />
      <Route path="/app/profil" element={emp(<Profil />)} />

      <Route path="/admin" element={adm(<Ringkasan />)} />
      <Route path="/admin/karyawan" element={adm(<Karyawan />)} />
      <Route path="/admin/jadwal" element={adm(<Jadwal />)} />
      <Route path="/admin/rekap" element={adm(<Rekap />)} />
      <Route path="/admin/lokasi" element={adm(<Lokasi />)} />
      <Route path="/admin/audit" element={adm(<Audit />)} />

      {/* Alamat lama dari versi sebelumnya */}
      <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/app/absensi" element={<Navigate to="/app/absen" replace />} />
      <Route path="/app/owner-dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="/app/laporan" element={<Navigate to="/admin/rekap" replace />} />
      <Route path="/app/setup" element={<Navigate to="/admin/lokasi" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
