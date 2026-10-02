import { AlertTriangle } from 'lucide-react'
import type { ScanSummary } from '../types'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel kpi-in flex-1 px-3 py-2.5">
      <div className="num text-[20px] leading-none text-[var(--text)]">{value}</div>
      <div className="label mt-1.5">{label}</div>
    </div>
  )
}

export function SummaryPanel({ summary }: { summary: ScanSummary }) {
  return (
    <section className="panel head-in p-4">
      <h2 className="label">Son tarama</h2>

      <div className="mt-3 flex gap-2">
        <Stat label="Shard" value={summary.shards} />
        <Stat label="Depo" value={summary.depots} />
        <Stat label="Item çeşidi" value={summary.varieties} />
        <Stat label="Yazılan" value={summary.notWritten ? '—' : summary.written} />
      </div>

      {summary.unresolved.length > 0 && (
        <>
          <p className="notice notice-warn mt-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              {summary.unresolved.length} codename çözümlenemedi. Oyun yeni item eklediyse{' '}
              <span className="mono">codenames.json</span> dosyasını güncellemen gerekir.
            </span>
          </p>

          <ul className="mono mt-2 grid max-h-28 gap-0.5 overflow-y-auto pr-1">
            {summary.unresolved.map((item) => (
              <li
                key={item.codename}
                className="flex items-center justify-between gap-3 text-[11px] text-[var(--text-dim)]"
              >
                <span className="truncate">{item.codename}</span>
                <span className="num shrink-0">×{item.qty}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}