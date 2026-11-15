import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Info, X, XCircle } from 'lucide-react'
import type { AttStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/types'

/* Logo: squircle dark green dengan double loop / figure-8 hijau terang ala Image 1 */
export function Brand({ invert = false, size = 28 }: { invert?: boolean; size?: number }) {
  return (
    <span className={`brand ${invert ? 'brand-invert' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={invert ? '#FFFFFF' : '#143e2e'} />
        <circle cx="16" cy="11.8" r="4.6" stroke={invert ? '#143e2e' : '#4ade80'} strokeWidth="2.6" />
        <circle cx="16" cy="20.2" r="4.6" stroke={invert ? '#143e2e' : '#4ade80'} strokeWidth="2.6" />
      </svg>
      <span className="brand-name">Saya Hadir</span>
    </span>
  )
}

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const tone = name.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 5
  return (
    <span className={`avatar tone-${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden={photo ? undefined : true}>
      {photo ? <img src={photo} alt={name} /> : initials}
    </span>
  )
}

const STATUS_ICON = { ontime: CheckCircle2, late: Clock, leave: Info, absent: XCircle } as const

export function StatusBadge({ status, label }: { status: AttStatus; label?: string }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={`badge badge-${status}`}>
      <Icon size={13} aria-hidden="true" />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'bad'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Notice({ tone = 'info', title, children, action }: { tone?: 'info' | 'warn' | 'bad' | 'ok'; title?: string; children?: ReactNode; action?: ReactNode }) {
  const Icon = tone === 'bad' ? XCircle : tone === 'warn' ? AlertTriangle : tone === 'ok' ? CheckCircle2 : Info
  return (
    <div className={`notice notice-${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <div className="notice-body">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-msg field-error" id={`${id}-msg`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-msg" id={`${id}-msg`}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}

/** Dialog: tengah layar di desktop, bottom sheet di ponsel (diatur CSS). */
export function Modal({ title, onClose, children, footer, wide = false }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sort?: (a: T, b: T) => number
  align?: 'right'
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  empty,
  initialSort,
  caption,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  pageSize?: number
  empty: ReactNode
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  caption: string
}) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(0)
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key)
    if (!col?.sort) return rows
    const out = [...rows].sort(col.sort)
    return sort?.dir === 'desc' ? out.reverse() : out
  }, [rows, sort, columns])
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const slice = sorted.slice(current * pageSize, current * pageSize + pageSize)

  const toggle = (key: string) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  if (!rows.length) return <>{empty}</>
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={c.align === 'right' ? 'ta-right' : ''} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort ? (
                    <button type="button" className="th-btn" onClick={() => toggle(c.key)}>
                      {c.header}
                      <ChevronDown size={13} className={`th-ico ${sort?.key === c.key ? 'on' : ''} ${sort?.key === c.key && sort.dir === 'asc' ? 'flip' : ''}`} aria-hidden="true" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === 'right' ? 'ta-right' : ''} ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        <span>
          {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} dari {sorted.length}
        </span>
        {pages > 1 && (
          <div className="pager">
            <button type="button" className="icon-btn" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Halaman sebelumnya">
              <ChevronLeft size={16} />
            </button>
            <span>
              {current + 1} / {pages}
            </span>
            <button type="button" className="icon-btn" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Halaman berikutnya">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
