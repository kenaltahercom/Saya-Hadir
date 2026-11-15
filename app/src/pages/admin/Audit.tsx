import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { PageHead } from '../../components/shells'
import { DataTable, Empty, type Column } from '../../components/ui'
import { downloadFile, toCsv } from '../../lib/csv'
import { useStore } from '../../lib/store'
import type { AuditEntry } from '../../lib/types'
import { fmtDateTime } from '../../lib/time'

export default function Audit() {
  const { db } = useStore()
  const d = db!
  const tz = d.company.timezone
  const [q, setQ] = useState('')
  const rows = useMemo(() => d.audit.filter((a) => !q || `${a.actor} ${a.action} ${a.target} ${a.detail}`.toLowerCase().includes(q.toLowerCase())), [d.audit, q])

  const cols: Column<AuditEntry>[] = [
    { key: 'at', header: 'Waktu', sort: (a, b) => a.at - b.at, render: (a) => <span className="num">{fmtDateTime(a.at, tz)}</span> },
    { key: 'actor', header: 'Oleh', render: (a) => a.actor },
    { key: 'action', header: 'Tindakan', render: (a) => <strong>{a.action}</strong> },
    { key: 'target', header: 'Objek', render: (a) => a.target },
    { key: 'detail', header: 'Rincian', render: (a) => <span className="muted">{a.detail || '–'}</span> },
  ]

  return (
    <>
      <PageHead
        title="Log audit"
        desc="Jejak perubahan data: siapa, kapan, dan apa yang berubah. Entri tidak bisa diedit."
        actions={
          <button className="btn btn-sm" disabled={!rows.length} onClick={() => downloadFile('log-audit.csv', toCsv([['waktu', 'oleh', 'tindakan', 'objek', 'rincian'], ...rows.map((a) => [fmtDateTime(a.at, tz), a.actor, a.action, a.target, a.detail])]))}>
            <Download size={15} aria-hidden="true" />
            Ekspor CSV
          </button>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <div className="field grow search">
            <label htmlFor="aq" className="sr-only">Cari log</label>
            <Search size={16} aria-hidden="true" />
            <input id="aq" type="search" placeholder="Cari pelaku, tindakan, atau objek" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <DataTable
          caption="Log audit"
          columns={cols}
          rows={rows}
          rowKey={(a) => a.id}
          pageSize={12}
          initialSort={{ key: 'at', dir: 'desc' }}
          empty={<div className="panel-body"><Empty title={d.audit.length ? 'Tidak ada entri yang cocok' : 'Belum ada aktivitas'}>Perubahan karyawan, jadwal, lokasi, dan koreksi absensi akan tercatat di sini.</Empty></div>}
        />
      </section>
    </>
  )
}
