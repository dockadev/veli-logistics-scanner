import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ChevronRight, MapPin } from 'lucide-react'
import type { RegionGroup, ScanSummary } from '../types'
import { useLanguage } from './LanguageProvider'
import type { TranslationKey } from '../lib/i18n'

/** Rust'ın döndürdüğü kararlı depo türü kimlikleri. */
type SubregionKey = Extract<
  TranslationKey,
  'storage' | 'seaport' | 'aircraft'
>

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel kpi-in flex-1 px-3 py-2.5">
      <div className="num text-[20px] leading-none text-[var(--text)]">{value}</div>
      <div className="label mt-1.5">{label}</div>
    </div>
  )
}

/**
 * Bölge satırı. Üzerine gelince (veya odaklanınca) o bölgenin depolar
 * açılır — alt bölge türüne göre gruplanmış depo etiketleriyle.
 *
 * Panel `document.body`'ye portal ile taşınır. `absolute` konumlandırma
 * kapsayıcının `overflow` ve `z-index` bağlamına takılıp panelin arkasında
 * kalan içeriği öne geçirirdi; portal bu etkileşimi tamamen ortadan
 * kaldırır ve konumu pencere koordinatlarıyla hesaplanır.
 */
function RegionRow({ group }: { group: RegionGroup }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rowRef = useRef<HTMLLIElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const total = group.subregions.reduce((sum, s) => sum + s.depots.length, 0)

  // Panel konumu, satırın ekrandaki yerinden hesaplanır. Pencere
  // kaydırılırsa veya boyutu değişirse yeniden hesaplanır.
  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }

    function place() {
      const row = rowRef.current
      if (!row) return
      const rect = row.getBoundingClientRect()
      const width = 320
      const left = Math.min(rect.left, window.innerWidth - width - 12)
      setPos({ top: rect.bottom + 4, left: Math.max(12, left) })
    }

    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  return (
    <li
      ref={rowRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        title={t('region_hover_hint')}
        className="row group flex w-full items-center justify-between gap-3 rounded-[6px] px-2 py-1.5 text-left"
      >
        <span className="truncate text-[12.5px] text-[var(--text)]">{group.region}</span>

        {/* Hover göstergesi: panel açılabilir olduğunu belli eder. */}
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="num text-[11px] text-[var(--text-dim)]">{total}</span>
          <ChevronRight
            size={12}
            className="text-[var(--text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          />
        </span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className="fixed z-[9999] w-[320px] max-w-[calc(100vw-24px)] rounded-[var(--radius)] border border-[var(--border-strong)] bg-[#0d1210] p-3 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.85)]"
          >
            {group.subregions.map((sub) => (
              <div key={sub.subregion} className="mb-2 last:mb-0">
                <div className="label mb-1">{t(sub.subregion as SubregionKey)}</div>
                <ul className="mono grid gap-0.5">
                  {sub.depots.map((depot) => (
                    <li
                      key={depot.location}
                      title={depot.location}
                      className="flex items-center justify-between gap-3 rounded-[4px] px-1 py-0.5 text-[11px] text-[var(--text-muted)]"
                    >
                      <span className="truncate">{depot.tag}</span>
                      <span className="num shrink-0 text-[var(--text-dim)]">
                        {t('item_count', { count: depot.itemCount })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </li>
  )
}

export function SummaryPanel({ summary }: { summary: ScanSummary }) {
  const { t } = useLanguage()

  return (
    <section className="panel head-in p-4">
      <div className="mt-3 flex gap-2">
        <Stat label={t('region_count')} value={summary.regions.length} />
        <Stat label={t('depot_count')} value={summary.depots} />
        <Stat label={t('item_varieties')} value={summary.varieties} />
        <Stat label={t('written')} value={summary.notWritten ? '—' : summary.written} />
      </div>

      {summary.regions.length > 0 && (
        <section className="mt-4 border-t border-[var(--border)] pt-3">
          <header className="flex items-center justify-between gap-3">
            <h3 className="label flex items-center gap-1.5">
              <MapPin size={11} />
              {t('scanned_regions')}
            </h3>
            <span className="text-[10.5px] text-[var(--text-dim)]">
              {t('regions_hover_hint')}
            </span>
          </header>

          <ul className="mt-2 grid gap-0.5">
            {summary.regions.map((group) => (
              <RegionRow key={group.region} group={group} />
            ))}
          </ul>
        </section>
      )}

      {summary.unresolved.length > 0 && (
        <>
          <p className="notice notice-warn mt-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>{t('unresolved_codenames', { count: summary.unresolved.length })}</span>
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