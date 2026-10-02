import { useState } from 'react'
import { FolderSearch, Loader2, Radar } from 'lucide-react'
import { formatMb } from '../lib/db'
import type { SaveFileInfo } from '../types'
import { useLanguage } from './LanguageProvider'

interface Props {
  files: SaveFileInfo[]
  busy: boolean
  onDetect: () => void
  onScan: () => void
}

export function ScanPanel({ files, busy, onDetect, onScan }: Props) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const dir = files[0]?.path.replace(/[\\/][^\\/]+$/, '') ?? ''

  return (
    <section className="panel head-in p-4">
      <header className="flex items-center justify-between">
        <h2 className="label">{t('save_files')}</h2>
        {files.length > 0 && (
          <span className="num text-[11px] text-[var(--text-dim)]">
            {files.length} · {formatMb(totalSize)}
          </span>
        )}
      </header>

      {files.length === 0 ? (
        <p className="mt-3 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-3 py-6 text-center text-[12px] text-[var(--text-dim)]">
          {t('not_searched')}
        </p>
      ) : (
        <>
          <p className="mono mt-2 truncate text-[11px] text-[var(--text-muted)]">{dir}</p>

          <ul className="mt-2 grid gap-1">
            {(expanded ? files : files.slice(0, 3)).map((file) => (
              <li
                key={file.path}
                className="row flex items-center justify-between gap-3 rounded-[6px] px-2 py-1.5"
              >
                <span className="mono truncate text-[11.5px] text-[var(--text)]">
                  {file.name}
                </span>
                <span className="num shrink-0 text-[10.5px] text-[var(--text-dim)]">
                  {formatMb(file.size)}
                </span>
              </li>
            ))}
          </ul>

          {files.length > 3 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="btn-ghost mt-1"
            >
              {expanded
                ? t('show_less')
                : t('show_more_files', { count: files.length - 3 })}
            </button>
          )}
        </>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onDetect}
          className="btn-secondary flex-1"
        >
          {busy ? <Loader2 size={14} className="spin" /> : <FolderSearch size={14} />}
          {t('detect')}
        </button>

        <button
          type="button"
          disabled={busy || files.length === 0}
          onClick={onScan}
          className="btn-primary flex-1"
        >
          {busy ? <Loader2 size={14} className="spin" /> : <Radar size={14} />}
          {t('scan_and_import')}
        </button>
      </div>
    </section>
  )
}