import { useEffect, useRef } from 'react'
import type { LogLine } from '../types'
import { useLanguage } from './LanguageProvider'

const TONE: Record<LogLine['kind'], string> = {
  info: 'text-[var(--text-dim)]',
  ok: 'text-[var(--accent)]',
  warn: 'text-[#eab308]',
  error: 'text-[var(--danger)]',
}

export function LogPanel({ lines }: { lines: LogLine[] }) {
  const { t } = useLanguage()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  return (
    <section className="panel head-in flex min-h-0 flex-1 flex-col p-4">
      <h2 className="label">{t('log_title')}</h2>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="text-[12px] text-[var(--text-dim)]">{t('log_empty')}</p>
        ) : (
          <ul className="mono grid gap-0.5">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-relaxed">
                <span className="shrink-0 text-[var(--text-dim)] opacity-60">{line.time}</span>
                <span className={TONE[line.kind]}>{line.message}</span>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  )
}