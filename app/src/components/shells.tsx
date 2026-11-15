import { useState, useMemo, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  CircleUser,
  ExternalLink,
  FileBarChart,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react'
import { logout, useStore } from '../lib/store'
import { Avatar, Brand, Notice, Spinner } from './ui'

export function Guard({ area, children }: { area: 'employee' | 'admin'; children: ReactNode }) {
  const { ready, account } = useStore()
  const loc = useLocation()
  if (!ready) {
    return (
      <div className="screen-center">
        <Spinner label="Memuat data…" />
      </div>
    )
  }
  if (!account) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (area === 'admin' && account.role === 'karyawan') {
    return (
      <div className="screen-center">
        <div className="denied">
          <h1>Halaman khusus Owner dan HR</h1>
          <p>Akun karyawan tidak punya akses ke pengelolaan data perusahaan.</p>
          <Link to="/app" className="btn btn-primary">
            Kembali ke absensi
          </Link>
        </div>
      </div>
    )
  }
  if (area === 'employee' && !account.employeeId) return <Navigate to="/admin" replace />
  return <>{children}</>
}

/* ───────────── Karyawan: Mobile Shell (Image Reference Style) ───────────── */

const USER_TABS = [
  { to: '/app', label: 'Beranda', icon: Home, end: true },
  { to: '/app/absen', label: 'Absen', icon: MapPin, end: false },
  { to: '/app/riwayat', label: 'Riwayat', icon: History, end: false },
  { to: '/app/profil', label: 'Profil', icon: CircleUser, end: false },
]

export function MobileShell({ children }: { children: ReactNode }) {
  const { db, account, storageError } = useStore()
  const loc = useLocation()
  const emp = db?.employees.find((e) => e.id === account?.employeeId)

  const activeIdx = useMemo(() => {
    const idx = USER_TABS.findIndex((t) => (t.end ? loc.pathname === t.to : loc.pathname.startsWith(t.to)))
    return idx >= 0 ? idx : 0
  }, [loc.pathname])

  return (
    <div className="m-root">
      <div className="m-frame">
        <header className="m-top">
          <Brand size={26} />
          <div className="m-company-pill">
            <span className="m-status-dot-pulse" title="Sistem Aktif" />
            <span className="m-company">{db?.company.name}</span>
          </div>
          {emp && (
            <Link to="/app/profil" aria-label="Profil saya" className="m-avatar">
              <Avatar name={emp.name} photo={emp.photo} size={34} />
            </Link>
          )}
        </header>

        <main className="m-main">
          {storageError && (
            <Notice tone="bad" title="Penyimpanan perangkat penuh">
              Perubahan terakhir tidak tersimpan.
            </Notice>
          )}
          <div className="m-content-anim" key={loc.pathname}>
            {children}
          </div>
        </main>

        {/* Floating Capsule Bottom Navigation ala Image Reference */}
        <nav className="m-pill-nav" aria-label="Navigasi utama">
          <div className="m-pill-capsule">
            {USER_TABS.map((t, idx) => {
              const isActive = idx === activeIdx
              return (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={`m-pill-tab ${isActive ? 'active' : ''}`}
                  aria-label={t.label}
                  title={t.label}
                >
                  <span className="m-pill-icon-wrap">
                    <t.icon size={21} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                  </span>
                  <span className="m-pill-label">{t.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

/* ───────────── Owner / HR: Desktop Shell (Image 1 Donezo style) ───────────── */

const ADMIN_NAV = [
  {
    group: 'MENU',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/karyawan', label: 'Karyawan', icon: Users, end: false, hasBadge: true },
      { to: '/admin/jadwal', label: 'Jadwal Kerja', icon: CalendarDays, end: false },
      { to: '/admin/rekap', label: 'Rekap Absensi', icon: FileBarChart, end: false },
    ],
  },
  {
    group: 'PENGATURAN',
    items: [
      { to: '/admin/lokasi', label: 'Lokasi & Radius', icon: MapPin, end: false },
      { to: '/admin/audit', label: 'Log Audit', icon: ShieldCheck, end: false },
    ],
  },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const { db, account, storageError } = useStore()
  const nav = useNavigate()
  const loc = useLocation()

  const out = () => {
    logout()
    nav('/login', { replace: true })
  }

  const activeEmployeeCount = useMemo(() => {
    return db?.employees.filter((e) => e.status === 'active').length ?? 0
  }, [db])

  // Simple quick filter for search bar
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !db) return []
    const q = searchQuery.toLowerCase()
    const matches: { title: string; desc: string; to: string }[] = []

    db.employees.forEach((e) => {
      if (e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.nip.toLowerCase().includes(q)) {
        matches.push({ title: e.name, desc: `${e.department} · NIP ${e.nip}`, to: '/admin/karyawan' })
      }
    })

    if ('jadwal'.includes(q) || 'shift'.includes(q)) {
      matches.push({ title: 'Jadwal Kerja', desc: 'Pengaturan jam kerja dan shift', to: '/admin/jadwal' })
    }
    if ('rekap'.includes(q) || 'laporan'.includes(q) || 'ekspor'.includes(q)) {
      matches.push({ title: 'Rekap Absensi', desc: 'Laporan kehadiran & ekspor CSV', to: '/admin/rekap' })
    }
    if ('lokasi'.includes(q) || 'radius'.includes(q) || 'gps'.includes(q)) {
      matches.push({ title: 'Lokasi Kantor', desc: 'Atur koordinat dan batas GPS', to: '/admin/lokasi' })
    }

    return matches.slice(0, 5)
  }, [searchQuery, db])

  return (
    <div className="a-root">
      {/* Sidebar Donezo style */}
      <aside className={`a-side ${open ? 'open' : ''}`} aria-label="Navigasi admin">
        <div className="a-side-top">
          <Brand size={30} />
          <button type="button" className="icon-btn a-close" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        <nav className="a-nav">
          {ADMIN_NAV.map((g) => (
            <div key={g.group} className="a-group-block">
              <p className="a-group-title">{g.group}</p>
              <div className="a-group-links">
                {g.items.map((i) => (
                  <NavLink
                    key={i.to}
                    to={i.to}
                    end={i.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `a-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="a-link-icon-wrap">
                      <i.icon size={18} aria-hidden="true" />
                    </span>
                    <span className="a-link-label">{i.label}</span>
                    {i.hasBadge && activeEmployeeCount > 0 && (
                      <span className="a-nav-badge">{activeEmployeeCount}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Bottom Banner Card ala Donezo */}
        <div className="a-side-promo">
          <div className="a-promo-card">
            <div className="a-promo-wave" aria-hidden="true" />
            <div className="a-promo-icon">
              <Smartphone size={20} />
            </div>
            <strong>Aplikasi Mobile</strong>
            <p>Akses cepat absensi tim langsung dari ponsel.</p>
            <Link to="/app" className="a-promo-btn">
              Buka Tampilan
            </Link>
          </div>
        </div>

        {/* User profile footer */}
        <div className="a-side-foot">
          <div className="a-user">
            <Avatar name={account?.name ?? 'Admin'} size={34} />
            <div className="a-user-info">
              <strong>{account?.name}</strong>
              <span>{account?.role === 'owner' ? 'Owner / Pimpinan' : 'Staff HR'}</span>
            </div>
            <button type="button" className="icon-btn" onClick={out} title="Keluar dari akun" aria-label="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="a-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Main Content Area */}
      <div className="a-main">
        {/* Top bar Donezo style */}
        <header className="a-topbar">
          <div className="a-topbar-left">
            <button type="button" className="icon-btn a-menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu">
              <Menu size={20} />
            </button>

            {/* Pill Search Bar */}
            <div className="a-search-pill">
              <Search size={16} className="a-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Cari karyawan, jadwal, tanggal..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
              />
              <span className="a-search-kbd">⌘K</span>

              {/* Search dropdown results */}
              {searchOpen && searchQuery.trim() && (
                <div className="a-search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((r, i) => (
                      <Link
                        key={i}
                        to={r.to}
                        className="a-search-item"
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
                      >
                        <div>
                          <strong>{r.title}</strong>
                          <p>{r.desc}</p>
                        </div>
                        <ExternalLink size={14} className="muted" />
                      </Link>
                    ))
                  ) : (
                    <div className="a-search-empty">Tidak ada data yang cocok dengan "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Topbar Right Icons & Profile */}
          <div className="a-topbar-right">
            {/* Quick Switch to Employee View */}
            {account?.employeeId && (
              <Link to="/app" className="a-topbar-pill-link" title="Buka tampilan mobile karyawan">
                <Smartphone size={15} />
                <span>Portal Karyawan</span>
              </Link>
            )}

            {/* Notifications Button */}
            <div className="a-topbar-notif-wrap">
              <button
                type="button"
                className="a-topbar-icon-btn"
                onClick={() => setBellOpen(!bellOpen)}
                aria-label="Pemberitahuan"
                title="Pemberitahuan"
              >
                <Bell size={18} />
                <span className="a-notif-dot" />
              </button>

              {bellOpen && (
                <div className="a-notif-popover">
                  <div className="a-notif-head">
                    <strong>Pemberitahuan</strong>
                    <button type="button" className="muted small" onClick={() => setBellOpen(false)}>
                      Tutup
                    </button>
                  </div>
                  <div className="a-notif-body">
                    <div className="a-notif-item">
                      <span className="a-notif-dot-sm" />
                      <div>
                        <p>
                          <strong>{db?.company.name}</strong>
                        </p>
                        <span className="small muted">Sistem absensi GPS aktif & siap digunakan.</span>
                      </div>
                    </div>
                    <div className="a-notif-item">
                      <span className="a-notif-dot-sm" style={{ background: '#f59e0b' }} />
                      <div>
                        <p>
                          <strong>Pengingat Toleransi</strong>
                        </p>
                        <span className="small muted">Batas toleransi keterlambatan diatur 15 menit.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="a-profile-pill">
              <Avatar name={account?.name ?? 'Admin'} size={32} />
              <div className="a-profile-text">
                <strong className="a-profile-name">{account?.name}</strong>
                <span className="a-profile-email">{account?.email ?? (account?.role === 'owner' ? 'Owner' : 'HR')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="a-content">
          {storageError && (
            <Notice tone="bad" title="Penyimpanan peramban penuh">
              Perubahan terakhir tidak tersimpan. Hapus foto selfie lama atau ekspor data lalu reset demo.
            </Notice>
          )}
          <div className="a-page-anim" key={loc.pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function PageHead({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}
